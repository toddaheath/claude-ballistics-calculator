using BallisticsCalculator.Core.Ballistics;
using BallisticsCalculator.Core.Interfaces;
using BallisticsCalculator.Infrastructure.Data;
using BallisticsCalculator.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Serilog.Formatting.Compact;

var builder = WebApplication.CreateBuilder(args);

// Serilog — compact JSON to stdout, configuration overridable via appsettings
builder.Host.UseSerilog((context, config) =>
    config
        .ReadFrom.Configuration(context.Configuration)
        .Enrich.FromLogContext()
        .WriteTo.Console(new CompactJsonFormatter()));

// Add services
builder.Services.AddControllers();
builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new Asp.Versioning.ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
}).AddMvc().AddApiExplorer(options =>
{
    options.GroupNameFormat = "'v'VVV";
    options.SubstituteApiVersionInUrl = true;
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Database=ballistics;Username=postgres;Password=postgres";

builder.Services.AddDbContext<BallisticsDbContext>(options =>
    options.UseNpgsql(connectionString)
           .UseSnakeCaseNamingConvention());

// DI registrations
builder.Services.AddScoped<ICartridgeRepository, CartridgeRepository>();
builder.Services.AddSingleton<TrajectoryCalculator>();

// CORS — origins configurable via CORS_ALLOWED_ORIGINS (comma-separated)
var corsOrigins = builder.Configuration["CorsAllowedOrigins"]
    ?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    ?? ["http://localhost:5173", "http://localhost:3000"];

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(corsOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Health checks
builder.Services.AddHealthChecks()
    .AddDbContextCheck<BallisticsDbContext>();

var app = builder.Build();

// Auto-apply migrations in development
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<BallisticsDbContext>();
    if (db.Database.IsRelational())
        db.Database.Migrate();
    else
        db.Database.EnsureCreated();

    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.MapControllers();
app.MapHealthChecks("/health");

app.Run();

// Make Program class accessible for integration tests
public partial class Program { }
