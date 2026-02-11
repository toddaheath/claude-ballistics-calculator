using BallisticsCalculator.Core.Ballistics;
using FluentAssertions;

namespace BallisticsCalculator.Core.Tests.Ballistics;

public class G1DragModelTests
{
    [Theory]
    [InlineData(0.0, 0.2629)]
    [InlineData(1.0, 0.3460)]
    [InlineData(2.0, 0.4483)]
    [InlineData(3.0, 0.3561)]
    [InlineData(5.0, 0.2983)]
    public void GetDragCoefficient_AtTableEntries_ReturnsExactValue(double mach, double expectedCd)
    {
        var cd = G1DragModel.GetDragCoefficient(mach);
        cd.Should().BeApproximately(expectedCd, 0.0001);
    }

    [Fact]
    public void GetDragCoefficient_BetweenEntries_Interpolates()
    {
        // Between Mach 0.0 (Cd=0.2629) and Mach 0.05 (Cd=0.2558)
        var cd = G1DragModel.GetDragCoefficient(0.025);
        cd.Should().BeApproximately(0.25935, 0.001);
    }

    [Fact]
    public void GetDragCoefficient_AtTransonic_ShowsIncrease()
    {
        var cdSubsonic = G1DragModel.GetDragCoefficient(0.8);
        var cdTransonic = G1DragModel.GetDragCoefficient(1.0);
        cdTransonic.Should().BeGreaterThan(cdSubsonic);
    }

    [Fact]
    public void GetDragCoefficient_NegativeMach_ReturnsMachZeroValue()
    {
        var cd = G1DragModel.GetDragCoefficient(-1.0);
        cd.Should().Be(G1DragModel.GetDragCoefficient(0.0));
    }

    [Fact]
    public void GetDragCoefficient_AboveMaxMach_ReturnsLastValue()
    {
        var cd = G1DragModel.GetDragCoefficient(10.0);
        cd.Should().Be(G1DragModel.GetDragCoefficient(5.0));
    }

    [Fact]
    public void GetDragCoefficient_MidRange_ReturnsReasonableValue()
    {
        var cd = G1DragModel.GetDragCoefficient(1.5);
        cd.Should().BeInRange(0.2, 0.6);
    }

    [Fact]
    public void GetDragCoefficient_PeakRegion_IsHighest()
    {
        // Cd peaks around Mach 1.4-1.45
        var cdPeak = G1DragModel.GetDragCoefficient(1.425);
        var cdLower = G1DragModel.GetDragCoefficient(1.0);
        var cdHigher = G1DragModel.GetDragCoefficient(2.0);
        cdPeak.Should().BeGreaterThan(cdLower);
        cdPeak.Should().BeGreaterThan(cdHigher);
    }
}
