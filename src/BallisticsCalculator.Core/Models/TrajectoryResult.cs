namespace BallisticsCalculator.Core.Models;

public class TrajectoryResult
{
    public List<TrajectoryPoint> Points { get; set; } = new();
    public double ZeroRange { get; set; }
    public double MuzzleVelocity { get; set; }
    public double MaxRange { get; set; }
    public string CartridgeName { get; set; } = string.Empty;
    public double BoreElevationAngleMOA { get; set; }
    public double HeightAt50 { get; set; }
    public double SecondCrossingRange { get; set; }
    public double ShotHeightInches { get; set; }
}
