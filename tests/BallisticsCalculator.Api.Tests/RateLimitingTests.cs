using System.Net;
using System.Net.Http.Json;
using BallisticsCalculator.Core.DTOs;
using FluentAssertions;

namespace BallisticsCalculator.Api.Tests;

public class RateLimitingTests : IClassFixture<RateLimitingWebApplicationFactory>
{
    private readonly HttpClient _client;

    public RateLimitingTests(RateLimitingWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task AuthEndpoint_ExceedingRateLimit_Returns429()
    {
        // The rate limiter allows 10 requests per minute per IP on auth endpoints.
        // Fire 12 login attempts to exceed the limit.
        var tasks = new List<Task<HttpResponseMessage>>();
        for (int i = 0; i < 12; i++)
        {
            tasks.Add(_client.PostAsJsonAsync("/api/v1/auth/login",
                new LoginRequestDto { Email = $"ratelimit-{i}@example.com", Password = "Password1!" }));
        }

        var responses = await Task.WhenAll(tasks);

        var statusCodes = responses.Select(r => r.StatusCode).ToList();
        // At least one should be 429 Too Many Requests
        statusCodes.Should().Contain(HttpStatusCode.TooManyRequests,
            "rate limiter should reject requests beyond the 10/minute limit");
    }

    [Fact]
    public async Task AuthEndpoint_WithinRateLimit_AllSucceed()
    {
        // Send fewer than the limit (3 requests) — all should succeed (401 for bad creds, not 429)
        var responses = new List<HttpResponseMessage>();
        for (int i = 0; i < 3; i++)
        {
            var resp = await _client.PostAsJsonAsync("/api/v1/auth/login",
                new LoginRequestDto { Email = $"within-limit-{i}@example.com", Password = "Password1!" });
            responses.Add(resp);
        }

        responses.Should().AllSatisfy(r =>
            r.StatusCode.Should().NotBe(HttpStatusCode.TooManyRequests));
    }
}
