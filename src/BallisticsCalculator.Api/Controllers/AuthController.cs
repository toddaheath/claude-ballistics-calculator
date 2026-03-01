using Asp.Versioning;
using BallisticsCalculator.Api.Services;
using BallisticsCalculator.Core.DTOs;
using BallisticsCalculator.Core.Interfaces;
using BallisticsCalculator.Core.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace BallisticsCalculator.Api.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[Produces("application/json")]
[EnableRateLimiting("auth")]
public class AuthController : ControllerBase
{
    private readonly IUserRepository _users;
    private readonly JwtService _jwt;

    public AuthController(IUserRepository users, JwtService jwt)
    {
        _users = users;
        _jwt = jwt;
    }

    /// <summary>Register a new user account.</summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
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
        var accessToken = _jwt.GenerateToken(created);
        var refreshToken = JwtService.GenerateRefreshToken();
        await _users.CreateRefreshTokenAsync(created.Id, refreshToken,
            DateTime.UtcNow.Add(JwtService.RefreshTokenLifetime));

        return Ok(new AuthResponseDto
        {
            Token        = accessToken,
            RefreshToken = refreshToken,
            Email        = created.Email,
            UserId       = created.Id,
        });
    }

    /// <summary>Authenticate with email and password.</summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginRequestDto request)
    {
        var user = await _users.GetByEmailAsync(request.Email);

        // Always run BCrypt.Verify to prevent timing-based email enumeration
        const string dummyHash = "$2a$11$K7HQVI5bnMQKH9MYB0v5suPZFJxP5P60P/2mYCHOqZGwTq/7MR.Cq";
        var hash = user?.PasswordHash ?? dummyHash;
        var passwordValid = BCrypt.Net.BCrypt.Verify(request.Password, hash);

        if (user is null || !passwordValid)
            return Unauthorized(new { message = "Invalid email or password." });

        var accessToken = _jwt.GenerateToken(user);
        var refreshToken = JwtService.GenerateRefreshToken();
        await _users.CreateRefreshTokenAsync(user.Id, refreshToken,
            DateTime.UtcNow.Add(JwtService.RefreshTokenLifetime));

        return Ok(new AuthResponseDto
        {
            Token        = accessToken,
            RefreshToken = refreshToken,
            Email        = user.Email,
            UserId       = user.Id,
        });
    }

    /// <summary>Exchange a refresh token for a new access token (token rotation).</summary>
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponseDto>> Refresh([FromBody] RefreshRequestDto request)
    {
        var storedToken = await _users.GetRefreshTokenAsync(request.RefreshToken);
        if (storedToken is null || storedToken.IsRevoked || storedToken.ExpiresAt < DateTime.UtcNow)
            return Unauthorized(new { message = "Invalid or expired refresh token." });

        // Revoke the used refresh token (rotation)
        await _users.RevokeRefreshTokenAsync(request.RefreshToken);

        var user = await _users.GetByIdAsync(storedToken.UserId);
        if (user is null)
            return Unauthorized(new { message = "User not found." });

        var newAccessToken = _jwt.GenerateToken(user);
        var newRefreshToken = JwtService.GenerateRefreshToken();
        await _users.CreateRefreshTokenAsync(user.Id, newRefreshToken,
            DateTime.UtcNow.Add(JwtService.RefreshTokenLifetime));

        return Ok(new AuthResponseDto
        {
            Token        = newAccessToken,
            RefreshToken = newRefreshToken,
            Email        = user.Email,
            UserId       = user.Id,
        });
    }

    /// <summary>Revoke a refresh token (logout).</summary>
    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> Logout([FromBody] RefreshRequestDto request)
    {
        await _users.RevokeRefreshTokenAsync(request.RefreshToken);
        return Ok(new { message = "Logged out successfully." });
    }
}
