namespace BallisticsCalculator.Core.DTOs;

public class MpbrResponseDto
{
    public double MpbrRange { get; set; }
    public double OptimalZeroRange { get; set; }
    public double VitalZoneRadiusInches { get; set; }
    public double NearZeroCrossing { get; set; }
    public double FarZeroCrossing { get; set; }
    public string CartridgeName { get; set; } = string.Empty;
    public string UnitSystem { get; set; } = "yards";
    public string DragModel { get; set; } = "G1";
}
