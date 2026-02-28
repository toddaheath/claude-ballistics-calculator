using Asp.Versioning;
using BallisticsCalculator.Core.Ballistics;
using BallisticsCalculator.Core.DTOs;
using BallisticsCalculator.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BallisticsCalculator.Api.Controllers;

[ApiController]
[Authorize]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
public class TrajectoryController : ControllerBase
{
    private readonly ICartridgeRepository _repository;
    private readonly TrajectoryCalculator _calculator;

    public TrajectoryController(ICartridgeRepository repository, TrajectoryCalculator calculator)
    {
        _repository = repository;
        _calculator = calculator;
    }

    [HttpPost]
    public async Task<ActionResult<TrajectoryResponseDto>> Calculate([FromBody] TrajectoryRequestDto request)
    {
        var cartridge = await _repository.GetByIdAsync(request.CartridgeId);
        if (cartridge is null)
            return NotFound(new { message = $"Cartridge with ID {request.CartridgeId} not found." });

        double zeroRange = request.ZeroRange ?? BallisticConstants.DefaultZeroRangeYards;
        double maxRange = request.MaxRange ?? BallisticConstants.DefaultMaxRangeYards;
        double shotHeight = request.ShotHeightInches ?? BallisticConstants.DefaultShotHeightInches;

        if (zeroRange >= maxRange)
            return BadRequest(new { message = "ZeroRange must be less than MaxRange." });

        var result = _calculator.Calculate(
            cartridge,
            zeroRange,
            maxRange,
            shotHeight,
            sightHeightInches: request.SightHeightInches ?? BallisticConstants.DefaultSightHeightInches,
            windSpeedMph: request.WindSpeedMph ?? 0,
            windDirectionDeg: request.WindDirectionDeg ?? 0,
            temperatureF: request.TemperatureF ?? BallisticConstants.StandardTemperatureF,
            altitudeFt: request.AltitudeFt ?? BallisticConstants.StandardAltitudeFt,
            pressureInHg: request.PressureInHg ?? BallisticConstants.StandardPressureInHg,
            humidityPercent: request.HumidityPercent ?? BallisticConstants.StandardHumidityPercent,
            shootingAngleDeg: request.ShootingAngleDeg ?? 0);

        bool isMetric = request.UnitSystem?.ToLowerInvariant() == "meters";

        var response = new TrajectoryResponseDto
        {
            CartridgeName = result.CartridgeName,
            ZeroRange = isMetric ? UnitConverter.YardsToMeters(result.ZeroRange) : result.ZeroRange,
            MuzzleVelocity = isMetric ? UnitConverter.FpsToMps(result.MuzzleVelocity) : result.MuzzleVelocity,
            MaxRange = isMetric ? UnitConverter.YardsToMeters(result.MaxRange) : result.MaxRange,
            BoreElevationAngleMOA = result.BoreElevationAngleMOA,
            HeightAt50 = isMetric ? UnitConverter.InchesToCm(result.HeightAt50) : result.HeightAt50,
            SecondCrossingRange = isMetric ? UnitConverter.YardsToMeters(result.SecondCrossingRange) : result.SecondCrossingRange,
            ShotHeight = isMetric ? UnitConverter.InchesToCm(shotHeight) : shotHeight,
            UnitSystem = isMetric ? "meters" : "yards",
            TransonicRange = isMetric ? UnitConverter.YardsToMeters(result.TransonicRange) : result.TransonicRange,
            Points = result.Points.Select(p => new TrajectoryPointDto
            {
                Range = isMetric ? UnitConverter.YardsToMeters(p.Range) : p.Range,
                Height = isMetric ? UnitConverter.InchesToCm(p.Height) : p.Height,
                Velocity = isMetric ? UnitConverter.FpsToMps(p.Velocity) : p.Velocity,
                Energy = isMetric ? UnitConverter.FootPoundsToJoules(p.Energy) : p.Energy,
                TimeOfFlight = p.TimeOfFlight,
                Mach = p.Mach,
                Drop = isMetric ? UnitConverter.InchesToCm(p.Drop) : p.Drop,
                WindDriftInches = isMetric ? UnitConverter.InchesToCm(p.WindDriftInches) : p.WindDriftInches,
                DropMoa = p.DropMoa,
                DropMils = p.DropMils,
                WindDriftMoa = p.WindDriftMoa,
                WindDriftMils = p.WindDriftMils,
                IsTransonic = p.IsTransonic
            }).ToList()
        };

        return Ok(response);
    }
}
