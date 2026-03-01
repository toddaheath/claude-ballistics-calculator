using Asp.Versioning;
using BallisticsCalculator.Core.Ballistics;
using BallisticsCalculator.Core.DTOs;
using BallisticsCalculator.Core.Interfaces;
using BallisticsCalculator.Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace BallisticsCalculator.Api.Controllers;

[ApiController]
[Authorize]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[EnableRateLimiting("api")]
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
    [ProducesResponseType(typeof(TrajectoryResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TrajectoryResponseDto>> Calculate([FromBody] TrajectoryRequestDto request)
    {
        var cartridge = await _repository.GetByIdAsync(request.CartridgeId);
        if (cartridge is null)
            return NotFound(new { message = $"Cartridge with ID {request.CartridgeId} not found." });

        var dragModel = ParseDragModel(request.DragModel);

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
            shootingAngleDeg: request.ShootingAngleDeg ?? 0,
            dragModel: dragModel);

        bool isMetric = request.UnitSystem?.ToLowerInvariant() == "meters";

        var response = MapToResponseDto(result, isMetric, shotHeight);
        response.DragModel = dragModel == DragModel.G7 ? "G7" : "G1";

        return Ok(response);
    }

    [HttpPost("compare")]
    [ProducesResponseType(typeof(CompareResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CompareResponseDto>> Compare([FromBody] CompareRequestDto request)
    {
        // Fetch all cartridges in a single query
        var cartridges = await _repository.GetByIdsAsync(request.CartridgeIds);
        if (cartridges.Count != request.CartridgeIds.Count)
        {
            var found = cartridges.Select(c => c.Id).ToHashSet();
            var missing = request.CartridgeIds.First(id => !found.Contains(id));
            return NotFound(new { message = $"Cartridge with ID {missing} not found." });
        }

        // Parse drag model
        var dragModel = ParseDragModel(request.DragModel);

        double zeroRange = request.ZeroRange ?? BallisticConstants.DefaultZeroRangeYards;
        double maxRange = request.MaxRange ?? BallisticConstants.DefaultMaxRangeYards;
        double shotHeight = request.ShotHeightInches ?? BallisticConstants.DefaultShotHeightInches;
        bool isMetric = request.UnitSystem?.ToLowerInvariant() == "meters";

        if (zeroRange >= maxRange)
            return BadRequest(new { message = "ZeroRange must be less than MaxRange." });

        // Preserve request order
        var cartridgeMap = cartridges.ToDictionary(c => c.Id);
        var trajectories = new List<TrajectoryResponseDto>();

        foreach (var cartridge in request.CartridgeIds.Select(id => cartridgeMap[id]))
        {
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
                shootingAngleDeg: request.ShootingAngleDeg ?? 0,
                dragModel: dragModel);

            var dto = MapToResponseDto(result, isMetric, shotHeight);
            dto.DragModel = dragModel == DragModel.G7 ? "G7" : "G1";
            trajectories.Add(dto);
        }

        return Ok(new CompareResponseDto
        {
            Trajectories = trajectories,
            UnitSystem = isMetric ? "meters" : "yards"
        });
    }

    [HttpPost("dope-card")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DopeCard([FromBody] TrajectoryRequestDto request)
    {
        var cartridge = await _repository.GetByIdAsync(request.CartridgeId);
        if (cartridge is null)
            return NotFound(new { message = $"Cartridge with ID {request.CartridgeId} not found." });

        var dragModel = ParseDragModel(request.DragModel);

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
            shootingAngleDeg: request.ShootingAngleDeg ?? 0,
            dragModel: dragModel);

        bool isMetric = request.UnitSystem?.ToLowerInvariant() == "meters";
        var mapped = MapToResponseDto(result, isMetric, shotHeight);

        // Filter points for DOPE card at practical intervals
        var dopePoints = mapped.Points.Where(p =>
        {
            if (p.Range == 0) return false;
            if (p.Range <= 300) return p.Range % 25 == 0;
            if (p.Range <= 500) return p.Range % 50 == 0;
            return p.Range % 100 == 0;
        }).ToList();

        var unitLabel = isMetric ? "m" : "yd";

        // Build CSV
        var sb = new System.Text.StringBuilder();
        sb.AppendLine($"# DOPE Card: {result.CartridgeName}");
        sb.AppendLine($"# Zero Range: {mapped.ZeroRange:F0} {unitLabel}");
        sb.AppendLine($"# Drag Model: {(dragModel == DragModel.G7 ? "G7" : "G1")}");
        sb.AppendLine($"# Date: {DateTime.UtcNow:yyyy-MM-dd}");
        sb.AppendLine("Range,Height,Velocity,Energy,Drop MOA,Drop Mils,Wind MOA,Wind Mils,Time of Flight");

        foreach (var p in dopePoints)
        {
            sb.AppendLine($"{p.Range:F0},{p.Height:F2},{p.Velocity:F0},{p.Energy:F0},{p.DropMoa:F2},{p.DropMils:F2},{p.WindDriftMoa:F2},{p.WindDriftMils:F2},{p.TimeOfFlight:F3}");
        }

        return File(System.Text.Encoding.UTF8.GetBytes(sb.ToString()), "text/csv", "dope-card.csv");
    }

    [HttpPost("mpbr")]
    [ProducesResponseType(typeof(MpbrResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MpbrResponseDto>> CalculateMpbr([FromBody] MpbrRequestDto request)
    {
        var cartridge = await _repository.GetByIdAsync(request.CartridgeId);
        if (cartridge is null)
            return NotFound(new { message = $"Cartridge with ID {request.CartridgeId} not found." });

        var dragModel = ParseDragModel(request.DragModel);
        double sightHeight = request.SightHeightInches ?? BallisticConstants.DefaultSightHeightInches;
        double vitalZone = request.VitalZoneRadiusInches ?? 3.0;
        bool isMetric = request.UnitSystem?.ToLowerInvariant() == "meters";

        var result = _calculator.CalculateMpbr(cartridge, vitalZone, sightHeight, dragModel: dragModel);

        return Ok(new MpbrResponseDto
        {
            MpbrRange = isMetric ? UnitConverter.YardsToMeters(result.MpbrRange) : result.MpbrRange,
            OptimalZeroRange = isMetric ? UnitConverter.YardsToMeters(result.OptimalZeroRange) : result.OptimalZeroRange,
            VitalZoneRadiusInches = isMetric ? UnitConverter.InchesToCm(result.VitalZoneRadiusInches) : result.VitalZoneRadiusInches,
            NearZeroCrossing = isMetric ? UnitConverter.YardsToMeters(result.NearZeroCrossing) : result.NearZeroCrossing,
            FarZeroCrossing = isMetric ? UnitConverter.YardsToMeters(result.FarZeroCrossing) : result.FarZeroCrossing,
            CartridgeName = cartridge.Name,
            UnitSystem = isMetric ? "meters" : "yards",
            DragModel = dragModel == DragModel.G7 ? "G7" : "G1"
        });
    }

    [HttpPost("custom")]
    [ProducesResponseType(typeof(TrajectoryResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public ActionResult<TrajectoryResponseDto> CalculateCustom([FromBody] CustomCartridgeRequestDto request)
    {
        var cartridge = new Cartridge
        {
            Id = 0,
            Name = request.Name,
            Category = "Custom",
            BulletWeightGrains = request.BulletWeightGrains,
            BulletWeightGrams = request.BulletWeightGrains * BallisticConstants.GrainsToGrams,
            BulletDiameterInches = request.BulletDiameterInches ?? 0.308,
            MuzzleVelocityFps = request.MuzzleVelocityFps,
            BallisticCoefficientG1 = request.BallisticCoefficient,
            BulletType = request.BulletType ?? "Custom"
        };

        var dragModel = ParseDragModel(request.DragModel);

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
            shootingAngleDeg: request.ShootingAngleDeg ?? 0,
            dragModel: dragModel);

        bool isMetric = request.UnitSystem?.ToLowerInvariant() == "meters";

        var response = MapToResponseDto(result, isMetric, shotHeight);
        response.DragModel = dragModel == DragModel.G7 ? "G7" : "G1";

        return Ok(response);
    }

    private static DragModel ParseDragModel(string? value) =>
        value?.ToUpperInvariant() == "G7" ? DragModel.G7 : DragModel.G1;

    private static TrajectoryResponseDto MapToResponseDto(TrajectoryResult result, bool isMetric, double shotHeight)
    {
        return new TrajectoryResponseDto
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
    }
}
