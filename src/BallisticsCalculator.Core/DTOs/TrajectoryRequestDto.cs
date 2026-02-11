namespace BallisticsCalculator.Core.DTOs;

public class TrajectoryRequestDto
{
    public int CartridgeId { get; set; }
    public double? ZeroRange { get; set; }
    public double? MaxRange { get; set; }
    public string UnitSystem { get; set; } = "yards";
    public double? ShotHeightInches { get; set; }
}
