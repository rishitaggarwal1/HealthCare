using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HealthCare.Controllers;

[ApiController]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    [HttpGet("stats")]
    [Authorize(Roles = "Admin")]
    public IActionResult Stats() => Ok(new { message = "Admin-only stats" });
}
