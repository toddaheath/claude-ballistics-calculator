using Asp.Versioning;
using BallisticsCalculator.Api.Services;
using BallisticsCalculator.Core.DTOs;
using BallisticsCalculator.Core.Interfaces;
using BallisticsCalculator.Core.Models;
using Microsoft.AspNetCore.Mvc;

namespace BallisticsCalculator.Api.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserRepository _users;
    private readonly JwtService _jwt;

    public AuthController(IUserRepository users, JwtService jwt)
    {
        _users = users;
        _jwt = jwt;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterRequestDto request)
    {
        if (await _users.EmailExistsAsync(request.Email))
            return Conflict(new { message = "Email already registered." });

        var hash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        var user = new User
        {
            Email        = request.Email,
            PasswordHash = hash,
            Provider     = "local",
            CreatedAt    = DateTime.UtcNow,
            UpdatedAt    = DateTime.UtcNow,
        };

        var created = await _users.CreateAsync(user);
        var token = _jwt.GenerateToken(created);

        return Ok(new AuthResponseDto
        {
            Token  = token,
            Email  = created.Email,
            UserId = created.Id,
        });
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginRequestDto request)
    {
        var user = await _users.GetByEmailAsync(request.Email);
        if (user is null || user.PasswordHash is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid email or password." });

        var token = _jwt.GenerateToken(user);

        return Ok(new AuthResponseDto
        {
            Token  = token,
            Email  = user.Email,
            UserId = user.Id,
        });
    }
}
