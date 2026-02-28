using System.ComponentModel.DataAnnotations;

namespace BallisticsCalculator.Core.DTOs;

public class CompareRequestDto
{
    [Required]
    [MinLength(2, ErrorMessage = "At least 2 cartridge IDs are required.")]
    [MaxLength(5, ErrorMessage = "At most 5 cartridge IDs can be compared.")]
    public List<int> CartridgeIds { get; set; } = new();

    [Range(10, 1000)]
    public double? ZeroRange { get; set; }

    [Range(10, 3000)]
    public double? MaxRange { get; set; }

    public string UnitSystem { get; set; } = "yards";

    public double? WindSpeedMph { get; set; }
    public double? WindDirectionDeg { get; set; }
    public double? TemperatureF { get; set; }
    public double? AltitudeFt { get; set; }
    public double? PressureInHg { get; set; }
    public double? HumidityPercent { get; set; }
    public double? SightHeightInches { get; set; }
    public double? ShotHeightInches { get; set; }
    public double? ShootingAngleDeg { get; set; }
    public string? DragModel { get; set; }
}
