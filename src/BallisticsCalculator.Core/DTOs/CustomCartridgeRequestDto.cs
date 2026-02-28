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

    public string? BulletType { get; set; }

    // Trajectory parameters
    [Range(10, 1000)]
    public double? ZeroRange { get; set; }

    [Range(10, 3000)]
    public double? MaxRange { get; set; }

    public string UnitSystem { get; set; } = "yards";

    public double? ShotHeightInches { get; set; }
    public double? SightHeightInches { get; set; }
    public double? WindSpeedMph { get; set; }
    public double? WindDirectionDeg { get; set; }
    public double? TemperatureF { get; set; }
    public double? AltitudeFt { get; set; }
    public double? PressureInHg { get; set; }
    public double? HumidityPercent { get; set; }
    public double? ShootingAngleDeg { get; set; }
    public string? DragModel { get; set; }
}
