namespace BallisticsCalculator.Core.Ballistics;

public enum DragModel
{
    G1,
    G7
}

public static class BallisticConstants
{
    // Gravity
    public const double Gravity = 32.174; // ft/s²

    // Standard atmosphere
    public const double StandardTemperatureF = 59.0;
    public const double StandardPressureInHg = 29.92;
    public const double SpeedOfSound = 1116.45; // fps
    public const double AirDensity = 0.002378; // slugs/ft³

    // Conversions
    public const double GrainsPerPound = 7000.0;
    public const double FeetPerYard = 3.0;
    public const double FeetPerMeter = 3.28084;
    public const double MetersPerYard = 0.9144;
    public const double InchesPerFoot = 12.0;
    public const double CmPerInch = 2.54;
    public const double JoulesPerFootPound = 1.35582;

    // Energy constant: energy (ft-lbs) = velocity² * weight(grains) / EnergyConstant
    public const double EnergyConstant = 450240.0;

    // Defaults
    public const double DefaultSightHeightInches = 1.5;
    public const double DefaultZeroRangeYards = 100.0;
    public const double DefaultShotHeightInches = 30.0; // Picnic table height
    public const double DefaultMaxRangeYards = 1000.0;

    // Atmosphere
    public const double StandardHumidityPercent = 0.0; // ICAO standard = 0% humidity
    public const double StandardAltitudeFt = 0.0;

    // Conversions for MOA/mils
    public const double MilsPerRadian = 1000.0; // NATO mils (actual: 2pi * 1000 / 6283.185 ~ 1)
    public const double InchesPerMOA_At100Yd = 1.047; // 1 MOA ~ 1.047" at 100 yards

    // Transonic threshold
    public const double TransonicMach = 1.2;

    // Math
    public const double RadiansPerMOA = Math.PI / (180.0 * 60.0);
    public const double MOAPerRadian = 180.0 * 60.0 / Math.PI;
}
