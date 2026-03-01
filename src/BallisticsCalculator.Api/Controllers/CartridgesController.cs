using Asp.Versioning;
using BallisticsCalculator.Core.DTOs;
using BallisticsCalculator.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace BallisticsCalculator.Api.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[Produces("application/json")]
public class CartridgesController : ControllerBase
{
    private readonly ICartridgeRepository _repository;
    private readonly IMemoryCache _cache;
    private const string AllCartridgesCacheKey = "all_cartridges";

    public CartridgesController(ICartridgeRepository repository, IMemoryCache cache)
    {
        _repository = repository;
        _cache = cache;
    }

    /// <summary>Get all cartridges in the database.</summary>
    [HttpGet]
    [ResponseCache(Duration = 3600)]
    [ProducesResponseType(typeof(List<CartridgeDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<CartridgeDto>>> GetAll()
    {
        if (_cache.TryGetValue(AllCartridgesCacheKey, out List<CartridgeDto>? cached))
            return Ok(cached);

        var cartridges = await _repository.GetAllAsync();
        var dtos = cartridges.Select(c => new CartridgeDto
        {
            Id = c.Id,
            Name = c.Name,
            Category = c.Category,
            BulletType = c.BulletType,
            BulletWeightGrains = c.BulletWeightGrains,
            MuzzleVelocityFps = c.MuzzleVelocityFps,
            BallisticCoefficientG1 = c.BallisticCoefficientG1
        }).ToList();

        _cache.Set(AllCartridgesCacheKey, dtos, TimeSpan.FromHours(1));
        return Ok(dtos);
    }

    /// <summary>Get a single cartridge by ID.</summary>
    [HttpGet("{id:int}")]
    [ResponseCache(Duration = 3600)]
    [ProducesResponseType(typeof(CartridgeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CartridgeDto>> GetById(int id)
    {
        var cartridge = await _repository.GetByIdAsync(id);
        if (cartridge is null)
            return NotFound(new { message = $"Cartridge with ID {id} not found." });

        return Ok(new CartridgeDto
        {
            Id = cartridge.Id,
            Name = cartridge.Name,
            Category = cartridge.Category,
            BulletType = cartridge.BulletType,
            BulletWeightGrains = cartridge.BulletWeightGrains,
            MuzzleVelocityFps = cartridge.MuzzleVelocityFps,
            BallisticCoefficientG1 = cartridge.BallisticCoefficientG1
        });
    }
}
