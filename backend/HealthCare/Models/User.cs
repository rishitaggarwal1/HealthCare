using System.ComponentModel.DataAnnotations;

namespace HealthCare.Models;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required] public string Name { get; set; } = string.Empty;

    [Required, EmailAddress] public string Email { get; set; } = string.Empty;

    [Required] public string PasswordHash { get; set; } = string.Empty;

    // "User" or "Admin"
    [Required] public string Role { get; set; } = "User";
}
