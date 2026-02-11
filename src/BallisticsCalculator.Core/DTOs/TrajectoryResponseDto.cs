namespace BallisticsCalculator.Core.DTOs;

public class TrajectoryResponseDto
{
    public List<TrajectoryPointDto> Points { get; set; } = new();
    public double ZeroRange { get; set; }
    public double MuzzleVelocity { get; set; }
    public double MaxRange { get; set; }
    public string CartridgeName { get; set; } = string.Empty;
    public double BoreElevationAngleMOA { get; set; }
    public double HeightAt50 { get; set; }
    public double SecondCrossingRange { get; set; }
    public double ShotHeightInches { get; set; }
    public string UnitSystem { get; set; } = "yards";
}

public class TrajectoryPointDto
{
    public double Range { get; set; }
    public double Height { get; set; }
    public double Velocity { get; set; }
    public double Energy { get; set; }
    public double TimeOfFlight { get; set; }
    public double Mach { get; set; }
    public double Drop { get; set; }
}
