using BallisticsCalculator.Core.Models;
using FluentAssertions;

namespace BallisticsCalculator.Core.Tests.Models;

public class CartridgeTests
{
    [Fact]
    public void Cartridge_DefaultValues_AreInitialized()
    {
        var cartridge = new Cartridge();

        cartridge.Id.Should().Be(0);
        cartridge.Name.Should().BeEmpty();
        cartridge.Category.Should().BeEmpty();
        cartridge.BulletType.Should().BeEmpty();
        cartridge.BulletWeightGrains.Should().Be(0);
        cartridge.MuzzleVelocityFps.Should().Be(0);
        cartridge.BallisticCoefficientG1.Should().Be(0);
    }

    [Fact]
    public void Cartridge_SetProperties_RetainsValues()
    {
        var cartridge = new Cartridge
        {
            Id = 1,
            Name = ".308 Win 168gr BTHP",
            Category = "Standard Rifle",
            BulletWeightGrains = 168,
            BulletWeightGrams = 10.89,
            BulletDiameterInches = 0.308,
            MuzzleVelocityFps = 2680,
            BallisticCoefficientG1 = 0.462,
            BulletType = "BTHP"
        };

        cartridge.Id.Should().Be(1);
        cartridge.Name.Should().Be(".308 Win 168gr BTHP");
        cartridge.Category.Should().Be("Standard Rifle");
        cartridge.BulletWeightGrains.Should().Be(168);
        cartridge.BulletWeightGrams.Should().Be(10.89);
        cartridge.BulletDiameterInches.Should().Be(0.308);
        cartridge.MuzzleVelocityFps.Should().Be(2680);
        cartridge.BallisticCoefficientG1.Should().Be(0.462);
        cartridge.BulletType.Should().Be("BTHP");
    }

    [Fact]
    public void TrajectoryPoint_DefaultValues()
    {
        var point = new TrajectoryPoint();

        point.Range.Should().Be(0);
        point.Height.Should().Be(0);
        point.Velocity.Should().Be(0);
        point.Energy.Should().Be(0);
        point.TimeOfFlight.Should().Be(0);
        point.Mach.Should().Be(0);
        point.Drop.Should().Be(0);
    }

    [Fact]
    public void TrajectoryResult_DefaultValues()
    {
        var result = new TrajectoryResult();

        result.Points.Should().BeEmpty();
        result.CartridgeName.Should().BeEmpty();
        result.ZeroRange.Should().Be(0);
        result.MuzzleVelocity.Should().Be(0);
        result.BoreElevationAngleMOA.Should().Be(0);
    }
}
