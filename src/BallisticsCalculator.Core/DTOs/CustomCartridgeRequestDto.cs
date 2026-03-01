using System.ComponentModel.DataAnnotations;

namespace BallisticsCalculator.Core.DTOs;

public class CustomCartridgeRequestDto
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = "Custom Load";

    [Range(10, 1000, ErrorMessage = "BulletWeightGrains must be between 10 and 1000.")]
    public double BulletWeightGrains { get; set; }

    [Range(100, 5000, ErrorMessage = "MuzzleVelocityFps must be between 100 and 5000.")]
    public double MuzzleVelocityFps { get; set; }

    [Range(0.01, 2.0, ErrorMessage = "BallisticCoefficient must be between 0.01 and 2.0.")]
    public double BallisticCoefficient { get; set; }

    [Range(0.1, 1.0, ErrorMessage = "BulletDiameterInches must be between 0.1 and 1.0.")]
    public double? BulletDiameterInches { get; set; }

    [MaxLength(50)]
    public string? BulletType { get; set; }

    // Trajectory parameters
    [Range(10, 1000)]
    public double? ZeroRange { get; set; }

    [Range(10, 3000)]
    public double? MaxRange { get; set; }

    [RegularExpression(@"^(yards|meters)$", ErrorMessage = "UnitSystem must be 'yards' or 'meters'.")]
    public string UnitSystem { get; set; } = "yards";

    [Range(0, 240, ErrorMessage = "ShotHeightInches must be between 0 and 240.")]
    public double? ShotHeightInches { get; set; }

    [Range(0.5, 6, ErrorMessage = "SightHeightInches must be between 0.5 and 6.")]
    public double? SightHeightInches { get; set; }

    [Range(0, 100, ErrorMessage = "WindSpeedMph must be between 0 and 100.")]
    public double? WindSpeedMph { get; set; }

    [Range(0, 360, ErrorMessage = "WindDirectionDeg must be between 0 and 360.")]
    public double? WindDirectionDeg { get; set; }

    [Range(-40, 140, ErrorMessage = "TemperatureF must be between -40 and 140.")]
    public double? TemperatureF { get; set; }

    [Range(0, 30000, ErrorMessage = "AltitudeFt must be between 0 and 30000.")]
    public double? AltitudeFt { get; set; }

    [Range(20, 35, ErrorMessage = "PressureInHg must be between 20 and 35.")]
    public double? PressureInHg { get; set; }

    [Range(0, 100, ErrorMessage = "HumidityPercent must be between 0 and 100.")]
    public double? HumidityPercent { get; set; }

    [Range(-90, 90, ErrorMessage = "ShootingAngleDeg must be between -90 and 90.")]
    public double? ShootingAngleDeg { get; set; }

    [RegularExpression(@"^(G1|G7)$", ErrorMessage = "DragModel must be 'G1' or 'G7'.")]
    public string? DragModel { get; set; }
}
