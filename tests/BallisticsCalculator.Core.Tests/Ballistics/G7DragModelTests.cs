using BallisticsCalculator.Core.Ballistics;
using FluentAssertions;

namespace BallisticsCalculator.Core.Tests.Ballistics;

public class G7DragModelTests
{
    [Theory]
    [InlineData(0.0, 0.1198)]
    [InlineData(1.0, 0.3803)]
    [InlineData(2.0, 0.2980)]
    [InlineData(3.0, 0.2424)]
    [InlineData(5.0, 0.1593)]
    public void GetDragCoefficient_AtTableEntries_ReturnsExactValue(double mach, double expectedCd)
    {
        var cd = G7DragModel.GetDragCoefficient(mach);
        cd.Should().BeApproximately(expectedCd, 0.0001);
    }

    [Fact]
    public void GetDragCoefficient_BetweenEntries_Interpolates()
    {
        // Between Mach 0.0 (Cd=0.1198) and Mach 0.05 (Cd=0.1197)
        var cd = G7DragModel.GetDragCoefficient(0.025);
        cd.Should().BeApproximately(0.11975, 0.001);
    }

    [Fact]
    public void GetDragCoefficient_AtTransonic_ShowsIncrease()
    {
        var cdSubsonic = G7DragModel.GetDragCoefficient(0.8);
        var cdTransonic = G7DragModel.GetDragCoefficient(1.0);
        cdTransonic.Should().BeGreaterThan(cdSubsonic);
    }

    [Fact]
    public void GetDragCoefficient_NegativeMach_ReturnsMachZeroValue()
    {
        var cd = G7DragModel.GetDragCoefficient(-1.0);
        cd.Should().Be(G7DragModel.GetDragCoefficient(0.0));
    }

    [Fact]
    public void GetDragCoefficient_AboveMaxMach_ReturnsLastValue()
    {
        var cd = G7DragModel.GetDragCoefficient(10.0);
        cd.Should().Be(G7DragModel.GetDragCoefficient(5.0));
    }

    [Fact]
    public void GetDragCoefficient_LowerThanG1_AtSubsonic()
    {
        // G7 should have lower drag than G1 at subsonic speeds (boat-tail advantage)
        var g7Cd = G7DragModel.GetDragCoefficient(0.8);
        var g1Cd = G1DragModel.GetDragCoefficient(0.8);
        g7Cd.Should().BeLessThan(g1Cd);
    }

    [Fact]
    public void GetDragCoefficient_PeakRegion_IsHighest()
    {
        // G7 Cd peaks around Mach 1.5-1.6
        var cdPeak = G7DragModel.GetDragCoefficient(1.55);
        var cdLower = G7DragModel.GetDragCoefficient(0.8);
        var cdHigher = G7DragModel.GetDragCoefficient(3.0);
        cdPeak.Should().BeGreaterThan(cdLower);
        cdPeak.Should().BeGreaterThan(cdHigher);
    }
}
