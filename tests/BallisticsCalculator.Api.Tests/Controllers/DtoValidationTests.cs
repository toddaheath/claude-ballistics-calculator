using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using BallisticsCalculator.Core.DTOs;
using FluentAssertions;

namespace BallisticsCalculator.Api.Tests.Controllers;

public class DtoValidationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public DtoValidationTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
        AuthorizeClientAsync(_client).GetAwaiter().GetResult();
    }

    private static async Task AuthorizeClientAsync(HttpClient client)
    {
        var unique = Guid.NewGuid().ToString("N")[..8];
        var reg = new RegisterRequestDto { Email = $"val-{unique}@example.com", Password = "Password1!" };
        var resp = await client.PostAsJsonAsync("/api/v1/auth/register", reg);
        var auth = await resp.Content.ReadFromJsonAsync<AuthResponseDto>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);
    }

    // ========== UnitSystem validation ==========

    [Fact]
    public async Task Trajectory_InvalidUnitSystem_Returns400()
    {
        var request = new TrajectoryRequestDto { CartridgeId = 29, UnitSystem = "cubits" };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Compare_InvalidUnitSystem_Returns400()
    {
        var request = new CompareRequestDto { CartridgeIds = [29, 30], UnitSystem = "cubits" };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory/compare", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Custom_InvalidUnitSystem_Returns400()
    {
        var request = new CustomCartridgeRequestDto
        {
            Name = "Test Load",
            BulletWeightGrains = 168,
            MuzzleVelocityFps = 2680,
            BallisticCoefficient = 0.462,
            UnitSystem = "furlongs"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory/custom", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Mpbr_InvalidUnitSystem_Returns400()
    {
        var request = new MpbrRequestDto { CartridgeId = 29, UnitSystem = "cubits" };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory/mpbr", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ========== DragModel validation ==========

    [Fact]
    public async Task Trajectory_InvalidDragModel_Returns400()
    {
        var request = new TrajectoryRequestDto { CartridgeId = 29, UnitSystem = "yards", DragModel = "G99" };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Custom_InvalidDragModel_Returns400()
    {
        var request = new CustomCartridgeRequestDto
        {
            Name = "Test Load",
            BulletWeightGrains = 168,
            MuzzleVelocityFps = 2680,
            BallisticCoefficient = 0.462,
            UnitSystem = "yards",
            DragModel = "invalid"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory/custom", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Trajectory_NullDragModel_Accepted()
    {
        var request = new TrajectoryRequestDto { CartridgeId = 29, UnitSystem = "yards", DragModel = null };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // ========== Environmental parameter range validation ==========

    [Fact]
    public async Task Trajectory_WindSpeedTooHigh_Returns400()
    {
        var request = new TrajectoryRequestDto { CartridgeId = 29, UnitSystem = "yards", WindSpeedMph = 200 };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Trajectory_HumidityOver100_Returns400()
    {
        var request = new TrajectoryRequestDto { CartridgeId = 29, UnitSystem = "yards", HumidityPercent = 150 };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Trajectory_ShootingAngleTooExtreme_Returns400()
    {
        var request = new TrajectoryRequestDto { CartridgeId = 29, UnitSystem = "yards", ShootingAngleDeg = 100 };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Compare_WindSpeedTooHigh_Returns400()
    {
        var request = new CompareRequestDto { CartridgeIds = [29, 30], UnitSystem = "yards", WindSpeedMph = 200 };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory/compare", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Compare_HumidityOver100_Returns400()
    {
        var request = new CompareRequestDto { CartridgeIds = [29, 30], UnitSystem = "yards", HumidityPercent = 150 };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory/compare", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Custom_WindSpeedTooHigh_Returns400()
    {
        var request = new CustomCartridgeRequestDto
        {
            Name = "Test Load",
            BulletWeightGrains = 168,
            MuzzleVelocityFps = 2680,
            BallisticCoefficient = 0.462,
            UnitSystem = "yards",
            WindSpeedMph = 200
        };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory/custom", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Custom_AltitudeTooHigh_Returns400()
    {
        var request = new CustomCartridgeRequestDto
        {
            Name = "Test Load",
            BulletWeightGrains = 168,
            MuzzleVelocityFps = 2680,
            BallisticCoefficient = 0.462,
            UnitSystem = "yards",
            AltitudeFt = 50000
        };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory/custom", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // ========== Auth DTO validation ==========

    [Fact]
    public async Task Login_PasswordTooLong_Returns400()
    {
        var request = new LoginRequestDto
        {
            Email = "test@example.com",
            Password = new string('a', 100) // exceeds MaxLength(72)
        };

        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_EmailTooLong_Returns400()
    {
        var request = new LoginRequestDto
        {
            Email = new string('a', 260) + "@b.c", // 264 chars, exceeds MaxLength(254)
            Password = "Password1!"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Register_PasswordTooShort_Returns400()
    {
        var request = new RegisterRequestDto
        {
            Email = "short@example.com",
            Password = "Ab1!" // less than MinLength(8)
        };

        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Register_PasswordTooLong_Returns400()
    {
        var request = new RegisterRequestDto
        {
            Email = "long@example.com",
            Password = new string('a', 100) // exceeds MaxLength(72)
        };

        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Register_EmailTooLong_Returns400()
    {
        var request = new RegisterRequestDto
        {
            Email = new string('a', 260) + "@b.c", // 264 chars, exceeds MaxLength(254)
            Password = "Password1!"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
