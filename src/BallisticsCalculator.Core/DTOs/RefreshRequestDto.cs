using System.ComponentModel.DataAnnotations;

namespace BallisticsCalculator.Core.DTOs;

public class RefreshRequestDto
{
    [Required(ErrorMessage = "RefreshToken is required.")]
    [MaxLength(500, ErrorMessage = "RefreshToken must be at most 500 characters.")]
    public string RefreshToken { get; set; } = string.Empty;
}
