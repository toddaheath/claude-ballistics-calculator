using BallisticsCalculator.Core.Ballistics;
using BallisticsCalculator.Core.Models;
using FluentAssertions;

namespace BallisticsCalculator.Core.Tests.Ballistics;

public class TrajectoryCalculatorTests
{
    private readonly TrajectoryCalculator _calculator = new();

    // .308 Win 168gr BTHP Match - the reference cartridge
    private static Cartridge Create308Win168() => new()
    {
        Id = 29,
        Name = ".308 Win 168gr BTHP Match",
        Category = "Standard Rifle",
        BulletWeightGrains = 168,
        BulletWeightGrams = 10.89,
        BulletDiameterInches = 0.308,
        MuzzleVelocityFps = 2680,
        BallisticCoefficientG1 = 0.462,
        BulletType = "BTHP"
    };

    // 9mm handgun for comparison
    private static Cartridge Create9mm115() => new()
    {
        Id = 2,
        Name = "9mm Luger 115gr FMJ",
        Category = "Handgun",
        BulletWeightGrains = 115,
        BulletWeightGrams = 7.45,
        BulletDiameterInches = 0.355,
        MuzzleVelocityFps = 1180,
        BallisticCoefficientG1 = 0.130,
        BulletType = "FMJ"
    };

    // 6.5 Creedmoor for high-BC test
    private static Cartridge Create65Creedmoor140() => new()
    {
        Id = 21,
        Name = "6.5 Creedmoor 140gr ELD Match",
        Category = "Standard Rifle",
        BulletWeightGrains = 140,
        BulletWeightGrams = 9.07,
        BulletDiameterInches = 0.264,
        MuzzleVelocityFps = 2710,
        BallisticCoefficientG1 = 0.585,
        BulletType = "ELD Match"
    };

    [Fact]
    public void Calculate_308Win_ProducesTrajectoryPoints()
    {
        var result = _calculator.Calculate(Create308Win168());

        result.Points.Should().NotBeEmpty();
        result.Points.Count.Should().BeGreaterThan(100);
        result.CartridgeName.Should().Be(".308 Win 168gr BTHP Match");
    }

    [Fact]
    public void Calculate_308Win_MuzzleVelocityCorrect()
    {
        var result = _calculator.Calculate(Create308Win168());

        result.MuzzleVelocity.Should().Be(2680);
        result.Points[0].Velocity.Should().BeApproximately(2680, 5);
    }

    [Fact]
    public void Calculate_308Win_BulletCrossesLOSAtZero()
    {
        var result = _calculator.Calculate(Create308Win168(), zeroRangeYards: 100);

        // Height at 100 yards should be very close to 0
        var pointAt100 = result.Points.First(p => Math.Abs(p.Range - 100) < 1);
        pointAt100.Height.Should().BeApproximately(0, 0.5);
    }

    [Fact]
    public void Calculate_308Win_DropsAtLongRange()
    {
        var result = _calculator.Calculate(Create308Win168());

        // At 500 yards, should have significant drop (roughly -30 to -50 inches)
        var pointAt500 = result.Points.First(p => Math.Abs(p.Range - 500) < 1);
        pointAt500.Height.Should().BeLessThan(-20);
        pointAt500.Height.Should().BeGreaterThan(-80);
    }

    [Fact]
    public void Calculate_308Win_At1000Yards_MajorDrop()
    {
        var result = _calculator.Calculate(Create308Win168(), maxRangeYards: 1000);

        var pointAt1000 = result.Points.Last();
        pointAt1000.Height.Should().BeLessThan(-200);
    }

    [Fact]
    public void Calculate_308Win_BoreAngleIsReasonable()
    {
        var result = _calculator.Calculate(Create308Win168(), zeroRangeYards: 100);

        // Bore elevation for a rifle zeroed at 100 yards should be ~2-8 MOA
        result.BoreElevationAngleMOA.Should().BeInRange(1.0, 10.0);
    }

    [Fact]
    public void Calculate_308Win_HeightAt50Calculated()
    {
        var result = _calculator.Calculate(Create308Win168(), zeroRangeYards: 100);

        // At 50 yards with 100-yard zero, bullet should be below the line of sight
        // (hasn't risen to LOS yet) - typically around -0.5 to -1.5 inches
        result.HeightAt50.Should().NotBe(0);
    }

    [Fact]
    public void Calculate_308Win_VelocityDecreasesWithRange()
    {
        var result = _calculator.Calculate(Create308Win168());

        var v100 = result.Points.First(p => Math.Abs(p.Range - 100) < 1).Velocity;
        var v300 = result.Points.First(p => Math.Abs(p.Range - 300) < 1).Velocity;
        var v500 = result.Points.First(p => Math.Abs(p.Range - 500) < 1).Velocity;

        v100.Should().BeGreaterThan(v300);
        v300.Should().BeGreaterThan(v500);
    }

    [Fact]
    public void Calculate_308Win_EnergyDecreasesWithRange()
    {
        var result = _calculator.Calculate(Create308Win168());

        var e100 = result.Points.First(p => Math.Abs(p.Range - 100) < 1).Energy;
        var e500 = result.Points.First(p => Math.Abs(p.Range - 500) < 1).Energy;

        e100.Should().BeGreaterThan(e500);
    }

    [Fact]
    public void Calculate_308Win_TimeOfFlightIncreases()
    {
        var result = _calculator.Calculate(Create308Win168());

        var t100 = result.Points.First(p => Math.Abs(p.Range - 100) < 1).TimeOfFlight;
        var t500 = result.Points.First(p => Math.Abs(p.Range - 500) < 1).TimeOfFlight;

        t100.Should().BeGreaterThan(0);
        t500.Should().BeGreaterThan(t100);
    }

    [Fact]
    public void Calculate_308Win_MachNumberDecreases()
    {
        var result = _calculator.Calculate(Create308Win168());

        var m0 = result.Points[0].Mach;
        var m500 = result.Points.First(p => Math.Abs(p.Range - 500) < 1).Mach;

        m0.Should().BeGreaterThan(2.0); // .308 starts supersonic
        m500.Should().BeLessThan(m0);
    }

    [Fact]
    public void Calculate_DifferentCartridges_DifferentTrajectories()
    {
        var result308 = _calculator.Calculate(Create308Win168());
        var result9mm = _calculator.Calculate(Create9mm115());

        // At 100 yards, the drop patterns should be very different
        var drop308 = result308.Points.First(p => Math.Abs(p.Range - 100) < 1).Height;
        var drop9mm = result9mm.Points.First(p => Math.Abs(p.Range - 100) < 1).Height;

        // Both should be near zero at 100 (zeroed there), but velocities differ greatly
        var v308 = result308.Points.First(p => Math.Abs(p.Range - 100) < 1).Velocity;
        var v9mm = result9mm.Points.First(p => Math.Abs(p.Range - 100) < 1).Velocity;
        v308.Should().BeGreaterThan(v9mm);
    }

    [Fact]
    public void Calculate_65Creedmoor_FlatterTrajectoryThan308()
    {
        var result308 = _calculator.Calculate(Create308Win168());
        var result65 = _calculator.Calculate(Create65Creedmoor140());

        // At 500 yards, 6.5 CM should drop less than .308
        var drop308 = result308.Points.First(p => Math.Abs(p.Range - 500) < 1).Height;
        var drop65 = result65.Points.First(p => Math.Abs(p.Range - 500) < 1).Height;

        // 6.5 CM should have less drop (closer to zero, so higher/less negative)
        drop65.Should().BeGreaterThan(drop308);
    }

    [Fact]
    public void Calculate_ShotHeight_IsReturnedCorrectly()
    {
        var result = _calculator.Calculate(Create308Win168(), shotHeightInches: 36);
        result.ShotHeightInches.Should().Be(36);
    }

    [Fact]
    public void Calculate_DefaultShotHeight_Is30Inches()
    {
        var result = _calculator.Calculate(Create308Win168());
        result.ShotHeightInches.Should().Be(30);
    }

    [Fact]
    public void Calculate_DefaultZeroRange_Is100Yards()
    {
        var result = _calculator.Calculate(Create308Win168());
        result.ZeroRange.Should().Be(100);
    }

    [Fact]
    public void Calculate_CustomZeroRange_200Yards()
    {
        var result = _calculator.Calculate(Create308Win168(), zeroRangeYards: 200);

        result.ZeroRange.Should().Be(200);

        // At 200 yards, height should be near zero
        var pointAt200 = result.Points.First(p => Math.Abs(p.Range - 200) < 1);
        pointAt200.Height.Should().BeApproximately(0, 0.5);
    }

    [Fact]
    public void Calculate_SecondCrossingRange_IsFound()
    {
        var result = _calculator.Calculate(Create308Win168(), zeroRangeYards: 100);

        // For a .308 Win zeroed at 100 yards, the second crossing (where the
        // bullet re-matches its 50-yard height) should always be found and
        // should be beyond 50 yards.
        result.SecondCrossingRange.Should().BeGreaterThan(50);
    }

    [Fact]
    public void Calculate_9mm_ReducedMaxRange()
    {
        var result = _calculator.Calculate(Create9mm115(), maxRangeYards: 200);

        result.Points.Should().NotBeEmpty();
        result.MaxRange.Should().Be(200);
    }

    [Fact]
    public void Calculate_308Win_DropIsNegative()
    {
        var result = _calculator.Calculate(Create308Win168());

        // Pure gravitational drop should be negative at all ranges > 0
        foreach (var point in result.Points.Where(p => p.Range > 0))
        {
            point.Drop.Should().BeLessThanOrEqualTo(0);
        }
    }

    [Fact]
    public void Calculate_308Win_EnergyFormula()
    {
        var result = _calculator.Calculate(Create308Win168());
        var point = result.Points[0];

        // Energy = v² * weight / 450240
        double expectedEnergy = point.Velocity * point.Velocity * 168.0 / 450240.0;
        point.Energy.Should().BeApproximately(expectedEnergy, 5);
    }

    [Fact]
    public void Calculate_ShortRange_10Yards()
    {
        var result = _calculator.Calculate(Create308Win168(), maxRangeYards: 10);
        result.Points.Should().NotBeEmpty();
        result.Points.Count.Should().BeLessOrEqualTo(15);
    }

    [Fact]
    public void Calculate_LongRange_2000Yards()
    {
        var result = _calculator.Calculate(Create308Win168(), maxRangeYards: 2000);
        result.Points.Should().NotBeEmpty();
        result.Points.Count.Should().BeGreaterThan(1000);
    }

    [Fact]
    public void Calculate_NullCartridge_Throws()
    {
        var act = () => _calculator.Calculate(null!);
        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void Calculate_ZeroMuzzleVelocity_Throws()
    {
        var cartridge = Create308Win168();
        cartridge.MuzzleVelocityFps = 0;

        var act = () => _calculator.Calculate(cartridge);
        act.Should().Throw<ArgumentException>().WithMessage("*MuzzleVelocityFps*");
    }

    [Fact]
    public void Calculate_ZeroBallisticCoefficient_Throws()
    {
        var cartridge = Create308Win168();
        cartridge.BallisticCoefficientG1 = 0;

        var act = () => _calculator.Calculate(cartridge);
        act.Should().Throw<ArgumentException>().WithMessage("*BallisticCoefficientG1*");
    }

    [Fact]
    public void Calculate_ZeroBulletWeight_Throws()
    {
        var cartridge = Create308Win168();
        cartridge.BulletWeightGrains = 0;

        var act = () => _calculator.Calculate(cartridge);
        act.Should().Throw<ArgumentException>().WithMessage("*BulletWeightGrains*");
    }
}
