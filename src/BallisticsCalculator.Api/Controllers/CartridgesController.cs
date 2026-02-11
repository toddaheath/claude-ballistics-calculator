using BallisticsCalculator.Core.DTOs;
using BallisticsCalculator.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace BallisticsCalculator.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CartridgesController : ControllerBase
{
    private readonly ICartridgeRepository _repository;

    public CartridgesController(ICartridgeRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<ActionResult<List<CartridgeDto>>> GetAll()
    {
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

        return Ok(dtos);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CartridgeDto>> GetById(int id)
    {
        var cartridge = await _repository.GetByIdAsync(id);
        if (cartridge is null)
            return NotFound();

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
