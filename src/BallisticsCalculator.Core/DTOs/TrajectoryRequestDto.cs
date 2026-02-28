using System.ComponentModel.DataAnnotations;

namespace BallisticsCalculator.Core.DTOs;

public class TrajectoryRequestDto
{
    [Range(1, int.MaxValue, ErrorMessage = "CartridgeId must be a positive integer.")]
    public int CartridgeId { get; set; }

    [Range(10, 1000, ErrorMessage = "ZeroRange must be between 10 and 1000.")]
    public double? ZeroRange { get; set; }

    [Range(10, 3000, ErrorMessage = "MaxRange must be between 10 and 3000.")]
    public double? MaxRange { get; set; }

    public string UnitSystem { get; set; } = "yards";

    [Range(0, 240, ErrorMessage = "ShotHeightInches must be between 0 and 240.")]
    public double? ShotHeightInches { get; set; }

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

    [Range(0.5, 6, ErrorMessage = "SightHeightInches must be between 0.5 and 6.")]
    public double? SightHeightInches { get; set; }

    [Range(-90, 90, ErrorMessage = "ShootingAngleDeg must be between -90 and 90.")]
    public double? ShootingAngleDeg { get; set; }
}
