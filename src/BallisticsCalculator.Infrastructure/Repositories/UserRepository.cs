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
}
