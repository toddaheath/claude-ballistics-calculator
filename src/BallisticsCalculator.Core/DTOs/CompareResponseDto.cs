namespace BallisticsCalculator.Core.DTOs;

public class CompareResponseDto
{
    public List<TrajectoryResponseDto> Trajectories { get; set; } = new();
    public string UnitSystem { get; set; } = "yards";
}
