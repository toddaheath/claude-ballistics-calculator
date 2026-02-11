using BallisticsCalculator.Core.Ballistics;
using BallisticsCalculator.Core.DTOs;
using BallisticsCalculator.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace BallisticsCalculator.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
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
            return NotFound($"Cartridge with ID {request.CartridgeId} not found.");

        double zeroRange = request.ZeroRange ?? BallisticConstants.DefaultZeroRangeYards;
        double maxRange = request.MaxRange ?? BallisticConstants.DefaultMaxRangeYards;
        double shotHeight = request.ShotHeightInches ?? BallisticConstants.DefaultShotHeightInches;

        var result = _calculator.Calculate(cartridge, zeroRange, maxRange, shotHeight);

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
            ShotHeightInches = isMetric ? UnitConverter.InchesToCm(shotHeight) : shotHeight,
            UnitSystem = isMetric ? "meters" : "yards",
            Points = result.Points.Select(p => new TrajectoryPointDto
            {
                Range = isMetric ? UnitConverter.YardsToMeters(p.Range) : p.Range,
                Height = isMetric ? UnitConverter.InchesToCm(p.Height) : p.Height,
                Velocity = isMetric ? UnitConverter.FpsToMps(p.Velocity) : p.Velocity,
                Energy = isMetric ? UnitConverter.FootPoundsToJoules(p.Energy) : p.Energy,
                TimeOfFlight = p.TimeOfFlight,
                Mach = p.Mach,
                Drop = isMetric ? UnitConverter.InchesToCm(p.Drop) : p.Drop
            }).ToList()
        };

        return Ok(response);
    }
}
