using BallisticsCalculator.Core.Ballistics;
using FluentAssertions;

namespace BallisticsCalculator.Core.Tests.Ballistics;

public class UnitConverterTests
{
    [Theory]
    [InlineData(100, 91.44)]
    [InlineData(0, 0)]
    [InlineData(1000, 914.4)]
    public void YardsToMeters_ConvertsCorrectly(double yards, double expectedMeters)
    {
        UnitConverter.YardsToMeters(yards).Should().BeApproximately(expectedMeters, 0.01);
    }

    [Theory]
    [InlineData(91.44, 100)]
    [InlineData(0, 0)]
    public void MetersToYards_ConvertsCorrectly(double meters, double expectedYards)
    {
        UnitConverter.MetersToYards(meters).Should().BeApproximately(expectedYards, 0.01);
    }

    [Theory]
    [InlineData(3000, 914.4)]
    [InlineData(0, 0)]
    public void FpsToMps_ConvertsCorrectly(double fps, double expectedMps)
    {
        UnitConverter.FpsToMps(fps).Should().BeApproximately(expectedMps, 1.0);
    }

    [Theory]
    [InlineData(914.4, 3000)]
    public void MpsToFps_ConvertsCorrectly(double mps, double expectedFps)
    {
        UnitConverter.MpsToFps(mps).Should().BeApproximately(expectedFps, 1.0);
    }

    [Theory]
    [InlineData(1.0, 2.54)]
    [InlineData(12.0, 30.48)]
    [InlineData(0, 0)]
    public void InchesToCm_ConvertsCorrectly(double inches, double expectedCm)
    {
        UnitConverter.InchesToCm(inches).Should().BeApproximately(expectedCm, 0.01);
    }

    [Theory]
    [InlineData(2.54, 1.0)]
    [InlineData(0, 0)]
    public void CmToInches_ConvertsCorrectly(double cm, double expectedInches)
    {
        UnitConverter.CmToInches(cm).Should().BeApproximately(expectedInches, 0.01);
    }

    [Theory]
    [InlineData(1000, 1355.82)]
    [InlineData(0, 0)]
    public void FootPoundsToJoules_ConvertsCorrectly(double ftLbs, double expectedJoules)
    {
        UnitConverter.FootPoundsToJoules(ftLbs).Should().BeApproximately(expectedJoules, 1.0);
    }

    [Theory]
    [InlineData(1355.82, 1000)]
    public void JoulesToFootPounds_ConvertsCorrectly(double joules, double expectedFtLbs)
    {
        UnitConverter.JoulesToFootPounds(joules).Should().BeApproximately(expectedFtLbs, 1.0);
    }

    [Fact]
    public void YardsToMeters_RoundTrip_ReturnsOriginal()
    {
        double original = 500.0;
        var result = UnitConverter.MetersToYards(UnitConverter.YardsToMeters(original));
        result.Should().BeApproximately(original, 0.001);
    }

    [Fact]
    public void FpsToMps_RoundTrip_ReturnsOriginal()
    {
        double original = 2800.0;
        var result = UnitConverter.MpsToFps(UnitConverter.FpsToMps(original));
        result.Should().BeApproximately(original, 0.001);
    }

    [Fact]
    public void InchesToCm_RoundTrip_ReturnsOriginal()
    {
        double original = 30.0;
        var result = UnitConverter.CmToInches(UnitConverter.InchesToCm(original));
        result.Should().BeApproximately(original, 0.001);
    }

    [Fact]
    public void FootPoundsToJoules_RoundTrip_ReturnsOriginal()
    {
        double original = 2500.0;
        var result = UnitConverter.JoulesToFootPounds(UnitConverter.FootPoundsToJoules(original));
        result.Should().BeApproximately(original, 0.01);
    }
}
