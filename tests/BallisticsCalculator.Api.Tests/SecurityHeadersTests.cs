using FluentAssertions;

namespace BallisticsCalculator.Api.Tests;

public class SecurityHeadersTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public SecurityHeadersTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Response_ContainsXContentTypeOptionsNosniff()
    {
        var response = await _client.GetAsync("/api/v1/cartridges");

        response.Headers.Should().ContainKey("X-Content-Type-Options");
        response.Headers.GetValues("X-Content-Type-Options").Should().Contain("nosniff");
    }

    [Fact]
    public async Task Response_ContainsXFrameOptionsDeny()
    {
        var response = await _client.GetAsync("/api/v1/cartridges");

        response.Headers.Should().ContainKey("X-Frame-Options");
        response.Headers.GetValues("X-Frame-Options").Should().Contain("DENY");
    }

    [Fact]
    public async Task Response_ContainsReferrerPolicy()
    {
        var response = await _client.GetAsync("/api/v1/cartridges");

        response.Headers.Should().ContainKey("Referrer-Policy");
        response.Headers.GetValues("Referrer-Policy").Should().Contain("strict-origin-when-cross-origin");
    }

    [Fact]
    public async Task Response_ContainsPermissionsPolicy()
    {
        var response = await _client.GetAsync("/api/v1/cartridges");

        response.Headers.Should().ContainKey("Permissions-Policy");
        response.Headers.GetValues("Permissions-Policy").Should().Contain("camera=(), microphone=(), geolocation=()");
    }

    [Fact]
    public async Task Response_ContainsContentSecurityPolicy()
    {
        var response = await _client.GetAsync("/api/v1/cartridges");

        response.Headers.Should().ContainKey("Content-Security-Policy");
        response.Headers.GetValues("Content-Security-Policy").Should().Contain("default-src 'none'; frame-ancestors 'none'");
    }
}
