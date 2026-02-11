using BallisticsCalculator.Core.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BallisticsCalculator.Infrastructure.Data;

public class CartridgeConfiguration : IEntityTypeConfiguration<Cartridge>
{
    public void Configure(EntityTypeBuilder<Cartridge> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Name).IsRequired().HasMaxLength(100);
        builder.Property(c => c.Category).IsRequired().HasMaxLength(50);
        builder.Property(c => c.BulletType).IsRequired().HasMaxLength(50);

        builder.HasData(GetSeedData());
    }

    private static Cartridge[] GetSeedData()
    {
        return new Cartridge[]
        {
            // === HANDGUN (12) ===
            new() { Id = 1, Name = ".380 ACP 95gr FMJ", Category = "Handgun", BulletWeightGrains = 95, BulletWeightGrams = 6.16, BulletDiameterInches = 0.355, MuzzleVelocityFps = 955, BallisticCoefficientG1 = 0.119, BulletType = "FMJ" },
            new() { Id = 2, Name = "9mm Luger 115gr FMJ", Category = "Handgun", BulletWeightGrains = 115, BulletWeightGrams = 7.45, BulletDiameterInches = 0.355, MuzzleVelocityFps = 1180, BallisticCoefficientG1 = 0.130, BulletType = "FMJ" },
            new() { Id = 3, Name = "9mm Luger 124gr JHP", Category = "Handgun", BulletWeightGrains = 124, BulletWeightGrams = 8.04, BulletDiameterInches = 0.355, MuzzleVelocityFps = 1150, BallisticCoefficientG1 = 0.143, BulletType = "JHP" },
            new() { Id = 4, Name = "9mm Luger 147gr JHP", Category = "Handgun", BulletWeightGrains = 147, BulletWeightGrams = 9.53, BulletDiameterInches = 0.355, MuzzleVelocityFps = 990, BallisticCoefficientG1 = 0.167, BulletType = "JHP" },
            new() { Id = 5, Name = ".40 S&W 165gr FMJ", Category = "Handgun", BulletWeightGrains = 165, BulletWeightGrams = 10.69, BulletDiameterInches = 0.400, MuzzleVelocityFps = 1060, BallisticCoefficientG1 = 0.140, BulletType = "FMJ" },
            new() { Id = 6, Name = ".40 S&W 180gr JHP", Category = "Handgun", BulletWeightGrains = 180, BulletWeightGrams = 11.66, BulletDiameterInches = 0.400, MuzzleVelocityFps = 1000, BallisticCoefficientG1 = 0.155, BulletType = "JHP" },
            new() { Id = 7, Name = ".45 ACP 185gr JHP", Category = "Handgun", BulletWeightGrains = 185, BulletWeightGrams = 11.99, BulletDiameterInches = 0.452, MuzzleVelocityFps = 1050, BallisticCoefficientG1 = 0.145, BulletType = "JHP" },
            new() { Id = 8, Name = ".45 ACP 230gr FMJ", Category = "Handgun", BulletWeightGrains = 230, BulletWeightGrams = 14.90, BulletDiameterInches = 0.452, MuzzleVelocityFps = 830, BallisticCoefficientG1 = 0.195, BulletType = "FMJ" },
            new() { Id = 9, Name = ".357 Magnum 125gr JHP", Category = "Handgun", BulletWeightGrains = 125, BulletWeightGrams = 8.10, BulletDiameterInches = 0.357, MuzzleVelocityFps = 1450, BallisticCoefficientG1 = 0.148, BulletType = "JHP" },
            new() { Id = 10, Name = ".357 Magnum 158gr JSP", Category = "Handgun", BulletWeightGrains = 158, BulletWeightGrams = 10.24, BulletDiameterInches = 0.357, MuzzleVelocityFps = 1235, BallisticCoefficientG1 = 0.164, BulletType = "JSP" },
            new() { Id = 11, Name = ".44 Magnum 240gr JSP", Category = "Handgun", BulletWeightGrains = 240, BulletWeightGrams = 15.55, BulletDiameterInches = 0.430, MuzzleVelocityFps = 1350, BallisticCoefficientG1 = 0.205, BulletType = "JSP" },
            new() { Id = 12, Name = "10mm Auto 180gr FMJ", Category = "Handgun", BulletWeightGrains = 180, BulletWeightGrams = 11.66, BulletDiameterInches = 0.400, MuzzleVelocityFps = 1200, BallisticCoefficientG1 = 0.164, BulletType = "FMJ" },

            // === INTERMEDIATE RIFLE (7) ===
            new() { Id = 13, Name = "5.56 NATO 55gr FMJ (M193)", Category = "Intermediate", BulletWeightGrains = 55, BulletWeightGrams = 3.56, BulletDiameterInches = 0.224, MuzzleVelocityFps = 3240, BallisticCoefficientG1 = 0.243, BulletType = "FMJ" },
            new() { Id = 14, Name = "5.56 NATO 62gr FMJ (M855)", Category = "Intermediate", BulletWeightGrains = 62, BulletWeightGrams = 4.02, BulletDiameterInches = 0.224, MuzzleVelocityFps = 3110, BallisticCoefficientG1 = 0.304, BulletType = "FMJ" },
            new() { Id = 15, Name = ".223 Rem 55gr V-MAX", Category = "Intermediate", BulletWeightGrains = 55, BulletWeightGrams = 3.56, BulletDiameterInches = 0.224, MuzzleVelocityFps = 3240, BallisticCoefficientG1 = 0.255, BulletType = "Polymer Tip" },
            new() { Id = 16, Name = ".223 Rem 77gr BTHP", Category = "Intermediate", BulletWeightGrains = 77, BulletWeightGrams = 4.99, BulletDiameterInches = 0.224, MuzzleVelocityFps = 2750, BallisticCoefficientG1 = 0.372, BulletType = "BTHP" },
            new() { Id = 17, Name = ".300 BLK 125gr OTM", Category = "Intermediate", BulletWeightGrains = 125, BulletWeightGrams = 8.10, BulletDiameterInches = 0.308, MuzzleVelocityFps = 2215, BallisticCoefficientG1 = 0.319, BulletType = "OTM" },
            new() { Id = 18, Name = ".300 BLK 220gr SMK Subsonic", Category = "Intermediate", BulletWeightGrains = 220, BulletWeightGrams = 14.26, BulletDiameterInches = 0.308, MuzzleVelocityFps = 1010, BallisticCoefficientG1 = 0.608, BulletType = "SMK" },
            new() { Id = 19, Name = "7.62x39mm 123gr FMJ", Category = "Intermediate", BulletWeightGrains = 123, BulletWeightGrams = 7.97, BulletDiameterInches = 0.312, MuzzleVelocityFps = 2350, BallisticCoefficientG1 = 0.300, BulletType = "FMJ" },

            // === STANDARD RIFLE (15) ===
            new() { Id = 20, Name = ".243 Win 100gr SP", Category = "Standard Rifle", BulletWeightGrains = 100, BulletWeightGrams = 6.48, BulletDiameterInches = 0.243, MuzzleVelocityFps = 2960, BallisticCoefficientG1 = 0.405, BulletType = "SP" },
            new() { Id = 21, Name = "6.5 Creedmoor 140gr ELD Match", Category = "Standard Rifle", BulletWeightGrains = 140, BulletWeightGrams = 9.07, BulletDiameterInches = 0.264, MuzzleVelocityFps = 2710, BallisticCoefficientG1 = 0.585, BulletType = "ELD Match" },
            new() { Id = 22, Name = "6.5 Creedmoor 120gr ELD Match", Category = "Standard Rifle", BulletWeightGrains = 120, BulletWeightGrams = 7.78, BulletDiameterInches = 0.264, MuzzleVelocityFps = 2910, BallisticCoefficientG1 = 0.486, BulletType = "ELD Match" },
            new() { Id = 23, Name = "6.5 Grendel 123gr ELD Match", Category = "Standard Rifle", BulletWeightGrains = 123, BulletWeightGrams = 7.97, BulletDiameterInches = 0.264, MuzzleVelocityFps = 2580, BallisticCoefficientG1 = 0.506, BulletType = "ELD Match" },
            new() { Id = 24, Name = ".270 Win 130gr SP", Category = "Standard Rifle", BulletWeightGrains = 130, BulletWeightGrams = 8.42, BulletDiameterInches = 0.277, MuzzleVelocityFps = 3060, BallisticCoefficientG1 = 0.408, BulletType = "SP" },
            new() { Id = 25, Name = ".270 Win 150gr Partition", Category = "Standard Rifle", BulletWeightGrains = 150, BulletWeightGrams = 9.72, BulletDiameterInches = 0.277, MuzzleVelocityFps = 2850, BallisticCoefficientG1 = 0.465, BulletType = "Partition" },
            new() { Id = 26, Name = "7mm Rem Mag 162gr ELD-X", Category = "Standard Rifle", BulletWeightGrains = 162, BulletWeightGrams = 10.50, BulletDiameterInches = 0.284, MuzzleVelocityFps = 2940, BallisticCoefficientG1 = 0.613, BulletType = "ELD-X" },
            new() { Id = 27, Name = "7mm Rem Mag 140gr AccuBond", Category = "Standard Rifle", BulletWeightGrains = 140, BulletWeightGrams = 9.07, BulletDiameterInches = 0.284, MuzzleVelocityFps = 3150, BallisticCoefficientG1 = 0.485, BulletType = "AccuBond" },
            new() { Id = 28, Name = ".30-30 Win 150gr FN", Category = "Standard Rifle", BulletWeightGrains = 150, BulletWeightGrams = 9.72, BulletDiameterInches = 0.308, MuzzleVelocityFps = 2390, BallisticCoefficientG1 = 0.226, BulletType = "Flat Nose" },
            new() { Id = 29, Name = ".308 Win 168gr BTHP Match", Category = "Standard Rifle", BulletWeightGrains = 168, BulletWeightGrams = 10.89, BulletDiameterInches = 0.308, MuzzleVelocityFps = 2680, BallisticCoefficientG1 = 0.462, BulletType = "BTHP" },
            new() { Id = 30, Name = ".308 Win 175gr SMK", Category = "Standard Rifle", BulletWeightGrains = 175, BulletWeightGrams = 11.34, BulletDiameterInches = 0.308, MuzzleVelocityFps = 2610, BallisticCoefficientG1 = 0.505, BulletType = "SMK" },
            new() { Id = 31, Name = ".308 Win 150gr SP", Category = "Standard Rifle", BulletWeightGrains = 150, BulletWeightGrams = 9.72, BulletDiameterInches = 0.308, MuzzleVelocityFps = 2820, BallisticCoefficientG1 = 0.387, BulletType = "SP" },
            new() { Id = 32, Name = ".30-06 Springfield 165gr SP", Category = "Standard Rifle", BulletWeightGrains = 165, BulletWeightGrams = 10.69, BulletDiameterInches = 0.308, MuzzleVelocityFps = 2800, BallisticCoefficientG1 = 0.428, BulletType = "SP" },
            new() { Id = 33, Name = ".30-06 Springfield 180gr Partition", Category = "Standard Rifle", BulletWeightGrains = 180, BulletWeightGrams = 11.66, BulletDiameterInches = 0.308, MuzzleVelocityFps = 2700, BallisticCoefficientG1 = 0.474, BulletType = "Partition" },
            new() { Id = 34, Name = "7.62 NATO 147gr FMJ (M80)", Category = "Standard Rifle", BulletWeightGrains = 147, BulletWeightGrams = 9.53, BulletDiameterInches = 0.308, MuzzleVelocityFps = 2800, BallisticCoefficientG1 = 0.393, BulletType = "FMJ" },

            // === MAGNUM / LONG-RANGE (9) ===
            new() { Id = 35, Name = ".300 Win Mag 190gr BTHP Match", Category = "Magnum", BulletWeightGrains = 190, BulletWeightGrams = 12.31, BulletDiameterInches = 0.308, MuzzleVelocityFps = 2900, BallisticCoefficientG1 = 0.533, BulletType = "BTHP" },
            new() { Id = 36, Name = ".300 Win Mag 180gr AccuBond", Category = "Magnum", BulletWeightGrains = 180, BulletWeightGrams = 11.66, BulletDiameterInches = 0.308, MuzzleVelocityFps = 2960, BallisticCoefficientG1 = 0.507, BulletType = "AccuBond" },
            new() { Id = 37, Name = ".300 Win Mag 220gr SMK", Category = "Magnum", BulletWeightGrains = 220, BulletWeightGrams = 14.26, BulletDiameterInches = 0.308, MuzzleVelocityFps = 2680, BallisticCoefficientG1 = 0.629, BulletType = "SMK" },
            new() { Id = 38, Name = ".338 Lapua Mag 250gr Scenar", Category = "Magnum", BulletWeightGrains = 250, BulletWeightGrams = 16.20, BulletDiameterInches = 0.338, MuzzleVelocityFps = 2950, BallisticCoefficientG1 = 0.675, BulletType = "Scenar" },
            new() { Id = 39, Name = ".338 Lapua Mag 300gr BTHP", Category = "Magnum", BulletWeightGrains = 300, BulletWeightGrams = 19.44, BulletDiameterInches = 0.338, MuzzleVelocityFps = 2750, BallisticCoefficientG1 = 0.720, BulletType = "BTHP" },
            new() { Id = 40, Name = ".338 Win Mag 225gr AccuBond", Category = "Magnum", BulletWeightGrains = 225, BulletWeightGrams = 14.58, BulletDiameterInches = 0.338, MuzzleVelocityFps = 2785, BallisticCoefficientG1 = 0.550, BulletType = "AccuBond" },
            new() { Id = 41, Name = ".375 H&H Mag 300gr DGX", Category = "Magnum", BulletWeightGrains = 300, BulletWeightGrams = 19.44, BulletDiameterInches = 0.375, MuzzleVelocityFps = 2530, BallisticCoefficientG1 = 0.480, BulletType = "DGX" },
            new() { Id = 42, Name = ".50 BMG 660gr FMJ (M33)", Category = "Magnum", BulletWeightGrains = 660, BulletWeightGrams = 42.77, BulletDiameterInches = 0.510, MuzzleVelocityFps = 2910, BallisticCoefficientG1 = 0.670, BulletType = "FMJ" },
            new() { Id = 43, Name = ".50 BMG 750gr A-MAX", Category = "Magnum", BulletWeightGrains = 750, BulletWeightGrams = 48.60, BulletDiameterInches = 0.510, MuzzleVelocityFps = 2820, BallisticCoefficientG1 = 1.050, BulletType = "A-MAX" },
        };
    }
}
