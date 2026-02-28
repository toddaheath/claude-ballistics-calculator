namespace BallisticsCalculator.Core.Ballistics;

public static class UnitConverter
{
    public static double YardsToMeters(double yards) => yards * BallisticConstants.MetersPerYard;
    public static double MetersToYards(double meters) => meters / BallisticConstants.MetersPerYard;

    public static double FpsToMps(double fps) => fps / BallisticConstants.FeetPerMeter;
    public static double MpsToFps(double mps) => mps * BallisticConstants.FeetPerMeter;

    public static double InchesToCm(double inches) => inches * BallisticConstants.CmPerInch;
    public static double CmToInches(double cm) => cm / BallisticConstants.CmPerInch;

    public static double FootPoundsToJoules(double ftLbs) => ftLbs * BallisticConstants.JoulesPerFootPound;
    public static double JoulesToFootPounds(double joules) => joules / BallisticConstants.JoulesPerFootPound;

    public static double MphToKph(double mph) => mph * 1.60934;
    public static double KphToMph(double kph) => kph / 1.60934;
}
