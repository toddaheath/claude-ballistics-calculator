using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using BallisticsCalculator.Core.DTOs;
using FluentAssertions;

namespace BallisticsCalculator.Api.Tests.Controllers;

public class AuthControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;

    public AuthControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Register_ValidCredentials_ReturnsOkWithToken()
    {
        var request = new RegisterRequestDto { Email = "newuser@example.com", Password = "Password1!" };

        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        result.Should().NotBeNull();
        result!.Token.Should().NotBeNullOrWhiteSpace();
        result.Email.Should().Be("newuser@example.com");
        result.UserId.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task Register_DuplicateEmail_Returns409()
    {
        var request = new RegisterRequestDto { Email = "duplicate@example.com", Password = "Password1!" };
        await _client.PostAsJsonAsync("/api/v1/auth/register", request);

        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", request);

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Register_EmptyEmail_Returns400()
    {
        var request = new RegisterRequestDto { Email = "", Password = "Password1!" };

        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", request);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_ValidCredentials_ReturnsToken()
    {
        var email = "logintest@example.com";
        var password = "Password1!";
        await _client.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequestDto { Email = email, Password = password });

        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequestDto { Email = email, Password = password });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        result!.Token.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Login_WrongPassword_Returns401()
    {
        var email = "wrongpass@example.com";
        await _client.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequestDto { Email = email, Password = "Password1!" });

        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequestDto { Email = email, Password = "WrongPassword!" });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Login_UnknownEmail_Returns401()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequestDto { Email = "nobody@example.com", Password = "Password1!" });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Trajectory_WithoutToken_Returns401()
    {
        var request = new TrajectoryRequestDto { CartridgeId = 29, UnitSystem = "yards" };

        var response = await _client.PostAsJsonAsync("/api/v1/trajectory", request);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Trajectory_WithValidToken_ReturnsOk()
    {
        // Register and get token
        var reg = new RegisterRequestDto { Email = "trajauth@example.com", Password = "Password1!" };
        var regResp = await _client.PostAsJsonAsync("/api/v1/auth/register", reg);
        var auth = await regResp.Content.ReadFromJsonAsync<AuthResponseDto>();

        // Call trajectory with token using a fresh client from the same factory
        var authedClient = _factory.CreateClient();
        authedClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);

        var request = new TrajectoryRequestDto { CartridgeId = 29, UnitSystem = "yards" };
        var response = await authedClient.PostAsJsonAsync("/api/v1/trajectory", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
