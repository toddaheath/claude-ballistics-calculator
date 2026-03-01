using System.ComponentModel.DataAnnotations;

namespace BallisticsCalculator.Core.DTOs;

public class LoginRequestDto
{
    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Email must be a valid email address.")]
    [MaxLength(254, ErrorMessage = "Email must be at most 254 characters.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required.")]
    [MaxLength(72, ErrorMessage = "Password must be at most 72 characters.")]
    public string Password { get; set; } = string.Empty;
}
