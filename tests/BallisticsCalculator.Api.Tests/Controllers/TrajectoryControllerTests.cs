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
}
