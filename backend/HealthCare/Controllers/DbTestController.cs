using HealthCare.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HealthCare.Controllers;

[ApiController]
[Route("api/db-test")]
public class DbTestController : ControllerBase
{
    private readonly AppDbContext _db;

    public DbTestController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public IActionResult Test()
    {
        try
        {
            _db.Database.OpenConnection();
            _db.Database.CloseConnection();

            return Ok("✅ Database connection successful");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"❌ Database error: {ex.Message}");
        }
    }
}
