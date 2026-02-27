using BallisticsCalculator.Core.Interfaces;
using BallisticsCalculator.Core.Models;
using BallisticsCalculator.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BallisticsCalculator.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly BallisticsDbContext _context;

    public UserRepository(BallisticsDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        var normalized = email.ToLowerInvariant();
        return await _context.Users.FirstOrDefaultAsync(u => u.Email == normalized);
    }

    public async Task<User?> GetByIdAsync(int id)
    {
        return await _context.Users.FindAsync(id);
    }

    public async Task<User> CreateAsync(User user)
    {
        user.Email = user.Email.ToLowerInvariant();
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }

    public async Task<bool> EmailExistsAsync(string email)
    {
        var normalized = email.ToLowerInvariant();
        return await _context.Users.AnyAsync(u => u.Email == normalized);
    }

    public async Task<RefreshToken> CreateRefreshTokenAsync(int userId, string token, DateTime expiresAt)
    {
        var refreshToken = new RefreshToken
        {
            UserId = userId,
            Token = token,
            ExpiresAt = expiresAt,
            CreatedAt = DateTime.UtcNow,
            IsRevoked = false
        };
        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync();
        return refreshToken;
    }

    public async Task<RefreshToken?> GetRefreshTokenAsync(string token)
    {
        return await _context.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == token);
    }

    public async Task RevokeRefreshTokenAsync(string token)
    {
        var refreshToken = await _context.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == token);
        if (refreshToken is not null)
        {
            refreshToken.IsRevoked = true;
            await _context.SaveChangesAsync();
        }
    }

    public async Task RevokeAllUserRefreshTokensAsync(int userId)
    {
        var tokens = await _context.RefreshTokens
            .Where(rt => rt.UserId == userId && !rt.IsRevoked)
            .ToListAsync();
        foreach (var token in tokens)
            token.IsRevoked = true;
        await _context.SaveChangesAsync();
    }
}
