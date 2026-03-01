using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using BallisticsCalculator.Core.DTOs;
using BallisticsCalculator.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

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

    private async Task<AuthResponseDto> RegisterAndGetTokens()
    {
        var email = $"refresh-{Guid.NewGuid()}@example.com";
        var resp = await _client.PostAsJsonAsync("/api/v1/auth/register",
            new RegisterRequestDto { Email = email, Password = "Password1!" });
        resp.EnsureSuccessStatusCode();
        return (await resp.Content.ReadFromJsonAsync<AuthResponseDto>())!;
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
    public async Task Register_DuplicateEmail_Returns409WithMessage()
    {
        var request = new RegisterRequestDto { Email = "duplicate@example.com", Password = "Password1!" };
        await _client.PostAsJsonAsync("/api/v1/auth/register", request);

        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", request);

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("Email already registered");
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
    public async Task Login_WrongPassword_Returns401WithMessage()
    {
        var email = "wrongpass@example.com";
        await _client.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequestDto { Email = email, Password = "Password1!" });

        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequestDto { Email = email, Password = "WrongPassword!" });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("Invalid email or password");
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

    // ── Refresh endpoint tests ──────────────────────────────────────

    [Fact]
    public async Task Refresh_ValidToken_ReturnsNewTokens()
    {
        var auth = await RegisterAndGetTokens();

        var response = await _client.PostAsJsonAsync("/api/v1/auth/refresh",
            new RefreshRequestDto { RefreshToken = auth.RefreshToken });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        result.Should().NotBeNull();
        result!.Token.Should().NotBeNullOrWhiteSpace();
        result.RefreshToken.Should().NotBeNullOrWhiteSpace();
        result.Token.Should().NotBe(auth.Token);
        result.RefreshToken.Should().NotBe(auth.RefreshToken);
    }

    [Fact]
    public async Task Refresh_ExpiredToken_Returns401()
    {
        var auth = await RegisterAndGetTokens();

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<BallisticsDbContext>();
        var storedToken = await db.RefreshTokens.FirstAsync(t => t.Token == auth.RefreshToken);
        storedToken.ExpiresAt = DateTime.UtcNow.AddDays(-1);
        await db.SaveChangesAsync();

        var response = await _client.PostAsJsonAsync("/api/v1/auth/refresh",
            new RefreshRequestDto { RefreshToken = auth.RefreshToken });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Refresh_RevokedToken_Returns401()
    {
        var auth = await RegisterAndGetTokens();

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<BallisticsDbContext>();
        var storedToken = await db.RefreshTokens.FirstAsync(t => t.Token == auth.RefreshToken);
        storedToken.IsRevoked = true;
        await db.SaveChangesAsync();

        var response = await _client.PostAsJsonAsync("/api/v1/auth/refresh",
            new RefreshRequestDto { RefreshToken = auth.RefreshToken });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Refresh_InvalidToken_Returns401()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/refresh",
            new RefreshRequestDto { RefreshToken = "not-a-real-token" });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Refresh_OldTokenAfterRotation_Returns401()
    {
        var auth = await RegisterAndGetTokens();
        var originalRefreshToken = auth.RefreshToken;

        // Rotate by refreshing once
        var refreshResp = await _client.PostAsJsonAsync("/api/v1/auth/refresh",
            new RefreshRequestDto { RefreshToken = originalRefreshToken });
        refreshResp.StatusCode.Should().Be(HttpStatusCode.OK);

        // Try using the old (now-revoked) token
        var response = await _client.PostAsJsonAsync("/api/v1/auth/refresh",
            new RefreshRequestDto { RefreshToken = originalRefreshToken });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ── Logout endpoint tests ───────────────────────────────────────

    [Fact]
    public async Task Logout_ValidToken_Returns200()
    {
        var auth = await RegisterAndGetTokens();

        var response = await _client.PostAsJsonAsync("/api/v1/auth/logout",
            new RefreshRequestDto { RefreshToken = auth.RefreshToken });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Logout_InvalidToken_Returns200()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/logout",
            new RefreshRequestDto { RefreshToken = "nonexistent-token" });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // ── Auth response content tests ──────────────────────────────────

    [Fact]
    public async Task Register_ReturnsRefreshToken()
    {
        var auth = await RegisterAndGetTokens();

        auth.RefreshToken.Should().NotBeNullOrWhiteSpace();
        auth.Token.Should().NotBeNullOrWhiteSpace();
        auth.Email.Should().Contain("@example.com");
        auth.UserId.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task Login_ReturnsRefreshToken()
    {
        var email = $"loginrt-{Guid.NewGuid().ToString("N")[..8]}@example.com";
        var password = "Password1!";
        await _client.PostAsJsonAsync("/api/v1/auth/register", new RegisterRequestDto { Email = email, Password = password });

        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequestDto { Email = email, Password = password });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        result!.RefreshToken.Should().NotBeNullOrWhiteSpace();
        result.Token.Should().NotBeNullOrWhiteSpace();
        result.Email.Should().Be(email);
    }

    [Fact]
    public async Task Refresh_NewTokenIsUsable()
    {
        var auth = await RegisterAndGetTokens();

        // Rotate to get new tokens
        var refreshResp = await _client.PostAsJsonAsync("/api/v1/auth/refresh",
            new RefreshRequestDto { RefreshToken = auth.RefreshToken });
        var newAuth = await refreshResp.Content.ReadFromJsonAsync<AuthResponseDto>();

        // Use the new access token to call a protected endpoint
        var authedClient = _factory.CreateClient();
        authedClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", newAuth!.Token);

        var trajResp = await authedClient.PostAsJsonAsync("/api/v1/trajectory",
            new TrajectoryRequestDto { CartridgeId = 29, UnitSystem = "yards" });

        trajResp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Refresh_NewRefreshTokenIsUsable()
    {
        var auth = await RegisterAndGetTokens();

        // First rotation
        var refreshResp = await _client.PostAsJsonAsync("/api/v1/auth/refresh",
            new RefreshRequestDto { RefreshToken = auth.RefreshToken });
        var newAuth = await refreshResp.Content.ReadFromJsonAsync<AuthResponseDto>();

        // Second rotation with the new refresh token
        var secondRefresh = await _client.PostAsJsonAsync("/api/v1/auth/refresh",
            new RefreshRequestDto { RefreshToken = newAuth!.RefreshToken });

        secondRefresh.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await secondRefresh.Content.ReadFromJsonAsync<AuthResponseDto>();
        result!.Token.Should().NotBeNullOrWhiteSpace();
        result.RefreshToken.Should().NotBe(newAuth.RefreshToken);
    }

    [Fact]
    public async Task Logout_ThenRefresh_Returns401()
    {
        var auth = await RegisterAndGetTokens();

        // Logout (revokes the refresh token)
        await _client.PostAsJsonAsync("/api/v1/auth/logout",
            new RefreshRequestDto { RefreshToken = auth.RefreshToken });

        // Try to refresh with the revoked token
        var response = await _client.PostAsJsonAsync("/api/v1/auth/refresh",
            new RefreshRequestDto { RefreshToken = auth.RefreshToken });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ── Public endpoint access without auth ──────────────────────────

    [Fact]
    public async Task Cartridges_WithoutAuth_ReturnsOk()
    {
        // Cartridges endpoint is public — no auth required
        var unauthClient = _factory.CreateClient();

        var response = await unauthClient.GetAsync("/api/v1/cartridges");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var cartridges = await response.Content.ReadFromJsonAsync<List<CartridgeDto>>();
        cartridges.Should().NotBeEmpty();
    }

    [Fact]
    public async Task CartridgeById_WithoutAuth_ReturnsOk()
    {
        var unauthClient = _factory.CreateClient();

        var response = await unauthClient.GetAsync("/api/v1/cartridges/29");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
