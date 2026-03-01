using System.ComponentModel.DataAnnotations;

namespace BallisticsCalculator.Core.DTOs;

public class LoginRequestDto
{
    [Required]
    [EmailAddress]
    [MaxLength(254)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(72)]
    public string Password { get; set; } = string.Empty;
}
