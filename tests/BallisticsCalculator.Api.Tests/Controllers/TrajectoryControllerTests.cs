using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using BallisticsCalculator.Core.DTOs;
using FluentAssertions;

namespace BallisticsCalculator.Api.Tests.Controllers;

public class TrajectoryControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public TrajectoryControllerTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
        AuthorizeClientAsync(_client).GetAwaiter().GetResult();
    }

    private static async Task AuthorizeClientAsync(HttpClient client)
    {
        var unique = Guid.NewGuid().ToString("N")[..8];
        var reg = new RegisterRequestDto { Email = $"traj-{unique}@example.com", Password = "Password1!" };
        var resp = await client.PostAsJsonAsync("/api/v1/auth/register", reg);
        var auth = await resp.Content.ReadFromJsonAsync<AuthResponseDto>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);
    }

    [Fact]
    public async Task Calculate_ValidRequest_ReturnsTrajectory()
    {
        var request = new TrajectoryRequestDto { CartridgeId = 29, UnitSystem = "yards" };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<TrajectoryResponseDto>();
        result.Should().NotBeNull();
        result!.Points.Should().NotBeEmpty();
        result.CartridgeName.Should().Contain(".308 Win");
    }

    [Fact]
    public async Task Calculate_InvalidCartridgeId_Returns404()
    {
        var request = new TrajectoryRequestDto { CartridgeId = 999, UnitSystem = "yards" };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory", request);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Calculate_MetricUnits_ReturnsMeters()
    {
        var request = new TrajectoryRequestDto { CartridgeId = 29, UnitSystem = "meters" };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory", request);
        var result = await response.Content.ReadFromJsonAsync<TrajectoryResponseDto>();

        result.Should().NotBeNull();
        result!.UnitSystem.Should().Be("meters");
        // Zero range should be ~91.44m (100 yards)
        result.ZeroRange.Should().BeApproximately(91.44, 1);
    }

    [Fact]
    public async Task Calculate_ImperialUnits_ReturnsYards()
    {
        var request = new TrajectoryRequestDto { CartridgeId = 29, UnitSystem = "yards" };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory", request);
        var result = await response.Content.ReadFromJsonAsync<TrajectoryResponseDto>();

        result.Should().NotBeNull();
        result!.UnitSystem.Should().Be("yards");
        result.ZeroRange.Should().Be(100);
    }

    [Fact]
    public async Task Calculate_IncludesBoreElevation()
    {
        var request = new TrajectoryRequestDto { CartridgeId = 29 };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory", request);
        var result = await response.Content.ReadFromJsonAsync<TrajectoryResponseDto>();

        result!.BoreElevationAngleMOA.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task Calculate_IncludesSecondCrossingRange()
    {
        var request = new TrajectoryRequestDto { CartridgeId = 29 };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory", request);
        var result = await response.Content.ReadFromJsonAsync<TrajectoryResponseDto>();

        // SecondCrossingRange can be 0 if not found, but the field should exist
        result!.SecondCrossingRange.Should().BeGreaterThanOrEqualTo(0);
    }

    [Fact]
    public async Task Calculate_HandgunCartridge_Works()
    {
        var request = new TrajectoryRequestDto { CartridgeId = 2, MaxRange = 200, UnitSystem = "yards" };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<TrajectoryResponseDto>();
        result!.Points.Should().NotBeEmpty();
        result.MaxRange.Should().Be(200);
    }

    [Fact]
    public async Task Calculate_CustomShotHeight_IsReflected()
    {
        var request = new TrajectoryRequestDto
        {
            CartridgeId = 29,
            ShotHeightInches = 48,
            UnitSystem = "yards"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory", request);
        var result = await response.Content.ReadFromJsonAsync<TrajectoryResponseDto>();

        result!.ShotHeight.Should().Be(48);
    }

    [Fact]
    public async Task Calculate_DefaultShotHeight_Is30()
    {
        var request = new TrajectoryRequestDto { CartridgeId = 29, UnitSystem = "yards" };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory", request);
        var result = await response.Content.ReadFromJsonAsync<TrajectoryResponseDto>();

        result!.ShotHeight.Should().Be(30);
    }

    [Fact]
    public async Task Calculate_CartridgeIdZero_Returns400()
    {
        var request = new TrajectoryRequestDto { CartridgeId = 0, UnitSystem = "yards" };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Calculate_MaxRangeTooSmall_Returns400()
    {
        var request = new TrajectoryRequestDto { CartridgeId = 29, MaxRange = 5, UnitSystem = "yards" };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Calculate_ZeroRangeExceedsMaxRange_Returns400()
    {
        var request = new TrajectoryRequestDto { CartridgeId = 29, ZeroRange = 500, MaxRange = 200, UnitSystem = "yards" };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Calculate_MagnumCartridge_Works()
    {
        var request = new TrajectoryRequestDto { CartridgeId = 42, UnitSystem = "yards" };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<TrajectoryResponseDto>();
        result!.CartridgeName.Should().Contain(".50 BMG");
    }

    // ========== Sprint 4: New API tests ==========

    [Fact]
    public async Task Calculate_WithWindParameters_ReturnsWindDrift()
    {
        var request = new TrajectoryRequestDto
        {
            CartridgeId = 29,
            UnitSystem = "yards",
            WindSpeedMph = 10,
            WindDirectionDeg = 90 // Right crosswind
        };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory", request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<TrajectoryResponseDto>();
        result.Should().NotBeNull();

        // Points at longer ranges should have non-zero wind drift
        var pointAt300 = result!.Points.First(p => Math.Abs(p.Range - 300) < 1);
        pointAt300.WindDriftInches.Should().NotBe(0);
        pointAt300.WindDriftMoa.Should().NotBe(0);
        pointAt300.WindDriftMils.Should().NotBe(0);
    }

    [Fact]
    public async Task Calculate_WithAtmospherics_ReturnsSuccess()
    {
        var request = new TrajectoryRequestDto
        {
            CartridgeId = 29,
            UnitSystem = "yards",
            TemperatureF = 90,
            AltitudeFt = 5000,
            PressureInHg = 24.90,
            HumidityPercent = 50
        };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory", request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<TrajectoryResponseDto>();
        result.Should().NotBeNull();
        result!.Points.Should().NotBeEmpty();
    }

    [Fact]
    public async Task Calculate_ResponseIncludesTransonicRange()
    {
        var request = new TrajectoryRequestDto
        {
            CartridgeId = 29,
            UnitSystem = "yards",
            MaxRange = 1200
        };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory", request);
        var result = await response.Content.ReadFromJsonAsync<TrajectoryResponseDto>();

        result.Should().NotBeNull();
        // .308 Win should go transonic within 1200 yards
        result!.TransonicRange.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task Calculate_ResponseIncludesMoaAndMils()
    {
        var request = new TrajectoryRequestDto
        {
            CartridgeId = 29,
            UnitSystem = "yards"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory", request);
        var result = await response.Content.ReadFromJsonAsync<TrajectoryResponseDto>();

        result.Should().NotBeNull();

        // At 500 yards, there should be significant drop, so MOA/mils should be non-zero
        var pointAt500 = result!.Points.First(p => Math.Abs(p.Range - 500) < 1);
        pointAt500.DropMoa.Should().NotBe(0);
        pointAt500.DropMils.Should().NotBe(0);

        // The IsTransonic field should be present (false for .308 at 500 yards)
        // .308 at 500 yards is still supersonic
        pointAt500.IsTransonic.Should().BeFalse();
    }

    // ========== Sprint 5: Compare endpoint tests ==========

    [Fact]
    public async Task Compare_TwoCartridges_ReturnsBothTrajectories()
    {
        var request = new CompareRequestDto
        {
            CartridgeIds = new List<int> { 29, 21 }, // .308 Win and 6.5 Creedmoor
            UnitSystem = "yards"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory/compare", request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<CompareResponseDto>();
        result.Should().NotBeNull();
        result!.Trajectories.Should().HaveCount(2);
        result.Trajectories[0].CartridgeName.Should().Contain(".308");
        result.Trajectories[1].CartridgeName.Should().Contain("6.5 Creedmoor");
    }

    [Fact]
    public async Task Compare_InvalidCartridgeId_Returns404()
    {
        var request = new CompareRequestDto
        {
            CartridgeIds = new List<int> { 29, 999 },
            UnitSystem = "yards"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory/compare", request);
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Compare_TooFewCartridges_Returns400()
    {
        var request = new CompareRequestDto
        {
            CartridgeIds = new List<int> { 29 },
            UnitSystem = "yards"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory/compare", request);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ========== Sprint 5: DOPE card tests ==========

    [Fact]
    public async Task DopeCard_ValidRequest_ReturnsCsv()
    {
        var request = new TrajectoryRequestDto { CartridgeId = 29, UnitSystem = "yards" };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory/dope-card", request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType!.MediaType.Should().Be("text/csv");

        var csv = await response.Content.ReadAsStringAsync();
        csv.Should().Contain("DOPE Card");
        csv.Should().Contain("Range,Height,Velocity");
    }

    [Fact]
    public async Task DopeCard_InvalidCartridge_Returns404()
    {
        var request = new TrajectoryRequestDto { CartridgeId = 999, UnitSystem = "yards" };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory/dope-card", request);
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ========== Sprint 5: G7 Drag Model API tests ==========

    [Fact]
    public async Task Calculate_WithG7DragModel_ReturnsSuccess()
    {
        var request = new TrajectoryRequestDto
        {
            CartridgeId = 29,
            UnitSystem = "yards",
            DragModel = "G7"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory", request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<TrajectoryResponseDto>();
        result.Should().NotBeNull();
        result!.DragModel.Should().Be("G7");
        result.Points.Should().NotBeEmpty();
    }

    // ========== Sprint 6: MPBR endpoint tests ==========

    [Fact]
    public async Task Mpbr_ValidRequest_ReturnsMpbrData()
    {
        var request = new MpbrRequestDto
        {
            CartridgeId = 29,
            UnitSystem = "yards"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory/mpbr", request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<MpbrResponseDto>();
        result.Should().NotBeNull();
        result!.MpbrRange.Should().BeGreaterThan(0);
        result.OptimalZeroRange.Should().BeGreaterThan(0);
        result.CartridgeName.Should().Contain(".308");
    }

    [Fact]
    public async Task Mpbr_InvalidCartridge_Returns404()
    {
        var request = new MpbrRequestDto { CartridgeId = 999, UnitSystem = "yards" };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory/mpbr", request);
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ========== Sprint 6: Custom cartridge tests ==========

    [Fact]
    public async Task Custom_ValidRequest_ReturnsTrajectory()
    {
        var request = new CustomCartridgeRequestDto
        {
            Name = "Test Custom Load",
            BulletWeightGrains = 175,
            MuzzleVelocityFps = 2600,
            BallisticCoefficient = 0.505,
            UnitSystem = "yards"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory/custom", request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<TrajectoryResponseDto>();
        result.Should().NotBeNull();
        result!.CartridgeName.Should().Be("Test Custom Load");
        result.Points.Should().NotBeEmpty();
    }

    [Fact]
    public async Task Custom_InvalidWeight_Returns400()
    {
        var request = new CustomCartridgeRequestDto
        {
            Name = "Bad Load",
            BulletWeightGrains = 0, // Invalid
            MuzzleVelocityFps = 2600,
            BallisticCoefficient = 0.505
        };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory/custom", request);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ========== Coverage: G7 drag model across all endpoints ==========

    [Fact]
    public async Task Compare_WithG7DragModel_ReturnsG7()
    {
        var request = new CompareRequestDto
        {
            CartridgeIds = new List<int> { 29, 21 },
            UnitSystem = "yards",
            DragModel = "G7"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory/compare", request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<CompareResponseDto>();
        result.Should().NotBeNull();
        result!.Trajectories.Should().HaveCount(2);
        result.Trajectories[0].DragModel.Should().Be("G7");
    }

    [Fact]
    public async Task DopeCard_WithG7DragModel_ReturnsCsvWithG7()
    {
        var request = new TrajectoryRequestDto
        {
            CartridgeId = 29,
            UnitSystem = "yards",
            DragModel = "G7"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory/dope-card", request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var csv = await response.Content.ReadAsStringAsync();
        csv.Should().Contain("G7");
    }

    [Fact]
    public async Task Mpbr_WithG7DragModel_ReturnsG7()
    {
        var request = new MpbrRequestDto
        {
            CartridgeId = 29,
            UnitSystem = "yards",
            DragModel = "G7"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory/mpbr", request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<MpbrResponseDto>();
        result!.DragModel.Should().Be("G7");
        result.MpbrRange.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task Custom_WithG7DragModel_ReturnsG7()
    {
        var request = new CustomCartridgeRequestDto
        {
            Name = "Custom G7",
            BulletWeightGrains = 175,
            MuzzleVelocityFps = 2600,
            BallisticCoefficient = 0.275,
            UnitSystem = "yards",
            DragModel = "G7"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory/custom", request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<TrajectoryResponseDto>();
        result!.DragModel.Should().Be("G7");
    }

    // ========== Coverage: Metric units across endpoints ==========

    [Fact]
    public async Task Compare_MetricUnits_ReturnsMeters()
    {
        var request = new CompareRequestDto
        {
            CartridgeIds = new List<int> { 29, 21 },
            UnitSystem = "meters"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory/compare", request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<CompareResponseDto>();
        result!.UnitSystem.Should().Be("meters");
        result.Trajectories[0].UnitSystem.Should().Be("meters");
        // Zero range should be ~91m
        result.Trajectories[0].ZeroRange.Should().BeApproximately(91.44, 1);
    }

    [Fact]
    public async Task Mpbr_MetricUnits_ReturnsMeters()
    {
        var request = new MpbrRequestDto
        {
            CartridgeId = 29,
            UnitSystem = "meters"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory/mpbr", request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<MpbrResponseDto>();
        result!.UnitSystem.Should().Be("meters");
        result.MpbrRange.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task Custom_MetricUnits_ReturnsMeters()
    {
        var request = new CustomCartridgeRequestDto
        {
            Name = "Custom Metric",
            BulletWeightGrains = 168,
            MuzzleVelocityFps = 2680,
            BallisticCoefficient = 0.462,
            UnitSystem = "meters"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory/custom", request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<TrajectoryResponseDto>();
        result!.UnitSystem.Should().Be("meters");
        result.ZeroRange.Should().BeApproximately(91.44, 1);
    }

    // ========== Coverage: ZeroRange >= MaxRange validation ==========

    [Fact]
    public async Task Compare_ZeroRangeExceedsMaxRange_Returns400()
    {
        var request = new CompareRequestDto
        {
            CartridgeIds = new List<int> { 29, 21 },
            UnitSystem = "yards",
            ZeroRange = 500,
            MaxRange = 200
        };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory/compare", request);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task DopeCard_ZeroRangeExceedsMaxRange_Returns400()
    {
        var request = new TrajectoryRequestDto
        {
            CartridgeId = 29,
            UnitSystem = "yards",
            ZeroRange = 500,
            MaxRange = 200
        };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory/dope-card", request);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Custom_ZeroRangeExceedsMaxRange_Returns400()
    {
        var request = new CustomCartridgeRequestDto
        {
            Name = "Bad Range",
            BulletWeightGrains = 175,
            MuzzleVelocityFps = 2600,
            BallisticCoefficient = 0.505,
            UnitSystem = "yards",
            ZeroRange = 500,
            MaxRange = 200
        };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory/custom", request);
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ========== Coverage: DOPE card with long range (exercises all range filters) ==========

    [Fact]
    public async Task DopeCard_LongRange_HasPointsAtAllIntervals()
    {
        var request = new TrajectoryRequestDto
        {
            CartridgeId = 29,
            UnitSystem = "yards",
            MaxRange = 1000
        };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory/dope-card", request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var csv = await response.Content.ReadAsStringAsync();
        var lines = csv.Split('\n', StringSplitOptions.RemoveEmptyEntries);

        // Should have data lines (skip header comments and column header)
        var dataLines = lines.Where(l => !l.StartsWith('#') && !l.StartsWith("Range")).ToList();
        dataLines.Count.Should().BeGreaterThan(10);

        // Should include a 25yd interval point (e.g. 75)
        dataLines.Should().Contain(l => l.StartsWith("75,"));
        // Should include a 50yd interval point beyond 300 (e.g. 350)
        dataLines.Should().Contain(l => l.StartsWith("350,"));
        // Should include a 100yd interval point beyond 500 (e.g. 600)
        dataLines.Should().Contain(l => l.StartsWith("600,"));
    }

    // ========== Coverage: MPBR with custom vital zone and sight height ==========

    [Fact]
    public async Task Mpbr_CustomVitalZone_ReturnsSuccess()
    {
        var request = new MpbrRequestDto
        {
            CartridgeId = 29,
            UnitSystem = "yards",
            VitalZoneRadiusInches = 5.0,
            SightHeightInches = 2.0
        };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory/mpbr", request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<MpbrResponseDto>();
        result!.VitalZoneRadiusInches.Should().Be(5.0);
        // Larger vital zone should give longer MPBR
        result.MpbrRange.Should().BeGreaterThan(200);
    }

    // ========== Coverage: Custom cartridge with all optional fields ==========

    [Fact]
    public async Task Custom_AllOptionalFields_ReturnsSuccess()
    {
        var request = new CustomCartridgeRequestDto
        {
            Name = "Fully Loaded",
            BulletWeightGrains = 168,
            MuzzleVelocityFps = 2680,
            BallisticCoefficient = 0.462,
            BulletDiameterInches = 0.308,
            BulletType = "BTHP",
            UnitSystem = "yards",
            MaxRange = 600,
            ZeroRange = 200,
            ShotHeightInches = 36,
            SightHeightInches = 2.0,
            WindSpeedMph = 10,
            WindDirectionDeg = 90,
            TemperatureF = 80,
            AltitudeFt = 3000,
            PressureInHg = 27.5,
            HumidityPercent = 40,
            ShootingAngleDeg = 15
        };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory/custom", request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<TrajectoryResponseDto>();
        result!.CartridgeName.Should().Be("Fully Loaded");
        result.ShotHeight.Should().Be(36);
        result.Points.Should().NotBeEmpty();
    }

    // ========== Coverage: Unauthenticated request returns 401 ==========

    [Fact]
    public async Task Calculate_Unauthenticated_Returns401()
    {
        var factory = new CustomWebApplicationFactory();
        var unauthClient = factory.CreateClient();

        var request = new TrajectoryRequestDto { CartridgeId = 29, UnitSystem = "yards" };
        var response = await unauthClient.PostAsJsonAsync("/api/v1/trajectory", request);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ========== Coverage: Compare with five cartridges (max) ==========

    [Fact]
    public async Task Compare_FiveCartridges_ReturnsAllTrajectories()
    {
        var request = new CompareRequestDto
        {
            CartridgeIds = new List<int> { 29, 21, 2, 10, 42 },
            UnitSystem = "yards"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory/compare", request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<CompareResponseDto>();
        result!.Trajectories.Should().HaveCount(5);
    }

    // ========== Coverage: Shooting angle on trajectory endpoint ==========

    [Fact]
    public async Task Calculate_WithShootingAngle_ReturnsSuccess()
    {
        var request = new TrajectoryRequestDto
        {
            CartridgeId = 29,
            UnitSystem = "yards",
            ShootingAngleDeg = 30
        };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory", request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var result = await response.Content.ReadFromJsonAsync<TrajectoryResponseDto>();
        result!.Points.Should().NotBeEmpty();
    }

    // ========== Coverage: DOPE card metric ==========

    [Fact]
    public async Task DopeCard_MetricUnits_ContainsMetricHeader()
    {
        var request = new TrajectoryRequestDto
        {
            CartridgeId = 29,
            UnitSystem = "meters",
            MaxRange = 500
        };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory/dope-card", request);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var csv = await response.Content.ReadAsStringAsync();
        // Metric zero range should be ~91m
        csv.Should().Contain("91");
    }
}
