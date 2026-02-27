using System.ComponentModel.DataAnnotations;

namespace BallisticsCalculator.Core.DTOs;

public class RefreshRequestDto
{
    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}
