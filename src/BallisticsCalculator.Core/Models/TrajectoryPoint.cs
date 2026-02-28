namespace BallisticsCalculator.Core.Models;

public class TrajectoryPoint
{
    public double Range { get; set; }
    public double Height { get; set; }
    public double Velocity { get; set; }
    public double Energy { get; set; }
    public double TimeOfFlight { get; set; }
    public double Mach { get; set; }
    public double Drop { get; set; }
    public double WindDriftInches { get; set; }
    public double DropMoa { get; set; }
    public double DropMils { get; set; }
    public double WindDriftMoa { get; set; }
    public double WindDriftMils { get; set; }
    public bool IsTransonic { get; set; }
}
