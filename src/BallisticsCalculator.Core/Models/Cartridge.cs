namespace BallisticsCalculator.Core.Models;

public class Cartridge
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public double BulletWeightGrains { get; set; }
    public double BulletWeightGrams { get; set; }
    public double BulletDiameterInches { get; set; }
    public double MuzzleVelocityFps { get; set; }
    public double BallisticCoefficientG1 { get; set; }
    public string BulletType { get; set; } = string.Empty;
}
