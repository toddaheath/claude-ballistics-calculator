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
}
