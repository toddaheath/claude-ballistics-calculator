using BallisticsCalculator.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BallisticsCalculator.Api.Tests;

public class RateLimitingWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = "TestDb_RateLimit_" + Guid.NewGuid();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration(config =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Secret"]   = "test-secret-that-is-at-least-32-characters-long",
                ["Jwt:Issuer"]   = "ballistics-api",
                ["Jwt:Audience"] = "ballistics-client",
                // Rate limiting is NOT disabled here
            });
        });

        builder.ConfigureServices(services =>
        {
            var descriptors = services
                .Where(d => d.ServiceType == typeof(DbContextOptions<BallisticsDbContext>)
                         || d.ServiceType == typeof(DbContextOptions))
                .ToList();
            foreach (var d in descriptors)
                services.Remove(d);

            services.AddDbContext<BallisticsDbContext>(options =>
            {
                options.UseInMemoryDatabase(_dbName);
            });
        });

        builder.UseEnvironment("Development");
    }
}
