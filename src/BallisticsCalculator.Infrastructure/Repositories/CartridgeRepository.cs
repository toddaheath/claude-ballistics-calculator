using BallisticsCalculator.Core.Interfaces;
using BallisticsCalculator.Core.Models;
using BallisticsCalculator.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BallisticsCalculator.Infrastructure.Repositories;

public class CartridgeRepository : ICartridgeRepository
{
    private readonly BallisticsDbContext _context;

    public CartridgeRepository(BallisticsDbContext context)
    {
        _context = context;
    }

    public async Task<List<Cartridge>> GetAllAsync()
    {
        return await _context.Cartridges
            .OrderBy(c => c.Category)
            .ThenBy(c => c.Name)
            .ToListAsync();
    }

    public async Task<Cartridge?> GetByIdAsync(int id)
    {
        return await _context.Cartridges.FindAsync(id);
    }
}
