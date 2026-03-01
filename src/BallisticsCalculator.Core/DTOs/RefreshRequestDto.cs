using System.ComponentModel.DataAnnotations;

namespace BallisticsCalculator.Core.DTOs;

public class RefreshRequestDto
{
    [Required]
    [MaxLength(500)]
    public string RefreshToken { get; set; } = string.Empty;
}
