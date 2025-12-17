using HealthCare.Data;
using HealthCare.DTOs;
using HealthCare.Models;
using HealthCare.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HealthCare.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly JwtTokenService _jwt;
    private readonly IConfiguration _config;

    public AuthController(AppDbContext db, JwtTokenService jwt, IConfiguration config)
    {
        _db = db;
        _jwt = jwt;
        _config = config;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register(RegisterRequest req)
    {
        var email = req.Email.Trim().ToLowerInvariant();

        if (await _db.Users.AnyAsync(u => u.Email == email))
            return BadRequest("Email already registered.");

        var user = new User
        {
            Name = req.Name.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            Role = "User"
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Registered successfully" });
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest req)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);

        if (user == null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return Unauthorized("Invalid credentials.");

        if (string.IsNullOrWhiteSpace(req.DeviceId))
            return BadRequest("DeviceId is required.");

        var refreshDays = int.Parse(_config["Jwt:RefreshTokenDays"] ?? "7");
        var refreshToken = Guid.NewGuid().ToString("N");
        var refreshHash = BCrypt.Net.BCrypt.HashPassword(refreshToken);

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "";
        var ua = Request.Headers.UserAgent.ToString();

        // Re-login on same device => revoke old session(s) for that device (optional but clean)
        var old = await _db.UserSessions
            .Where(s => s.UserId == user.Id && s.DeviceId == req.DeviceId && !s.IsRevoked)
            .ToListAsync();
        foreach (var s in old) s.IsRevoked = true;

        var session = new UserSession
        {
            UserId = user.Id,
            DeviceId = req.DeviceId,
            DeviceName = string.IsNullOrWhiteSpace(req.DeviceName) ? "Unknown" : req.DeviceName!,
            UserAgent = ua,
            IpAddress = ip,
            RefreshTokenHash = refreshHash,
            ExpiresAt = DateTime.UtcNow.AddDays(refreshDays)
        };

        _db.UserSessions.Add(session);
        await _db.SaveChangesAsync();

        var access = _jwt.CreateAccessToken(user);

        return Ok(new AuthResponse(access, refreshToken, session.Id, user.Role));
    }

    // Access token expired -> frontend calls refresh with refreshToken + sessionId
    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<IActionResult> Refresh(RefreshRequest req)
    {
        var session = await _db.UserSessions.FirstOrDefaultAsync(s => s.Id == req.SessionId);
        if (session == null || session.IsRevoked || session.ExpiresAt <= DateTime.UtcNow)
            return Unauthorized("Session expired.");

        if (!BCrypt.Net.BCrypt.Verify(req.RefreshToken, session.RefreshTokenHash))
            return Unauthorized("Invalid refresh token.");

        var user = await _db.Users.FirstAsync(u => u.Id == session.UserId);
        var newAccess = _jwt.CreateAccessToken(user);

        return Ok(new { accessToken = newAccess, role = user.Role });
    }

    // Logout current device
    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout(LogoutRequest req)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var session = await _db.UserSessions.FirstOrDefaultAsync(s => s.Id == req.SessionId && s.UserId == userId);
        if (session != null)
        {
            session.IsRevoked = true;
            await _db.SaveChangesAsync();
        }
        return NoContent();
    }

    // List active sessions (devices)
    [HttpGet("sessions")]
    [Authorize]
    public async Task<IActionResult> Sessions()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var sessions = await _db.UserSessions
            .Where(s => s.UserId == userId && !s.IsRevoked && s.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new
            {
                s.Id,
                s.DeviceId,
                s.DeviceName,
                s.IpAddress,
                s.UserAgent,
                s.CreatedAt,
                s.ExpiresAt
            })
            .ToListAsync();

        return Ok(sessions);
    }

    // Revoke any device session from UI
    [HttpDelete("sessions/{sessionId:guid}")]
    [Authorize]
    public async Task<IActionResult> RevokeSession(Guid sessionId)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var session = await _db.UserSessions.FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);
        if (session != null)
        {
            session.IsRevoked = true;
            await _db.SaveChangesAsync();
        }
        return NoContent();
    }
}
