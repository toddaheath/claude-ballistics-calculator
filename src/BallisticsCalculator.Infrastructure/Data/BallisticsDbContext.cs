using BallisticsCalculator.Core.Models;
using Microsoft.EntityFrameworkCore;

namespace BallisticsCalculator.Infrastructure.Data;

public class BallisticsDbContext : DbContext
{
    public BallisticsDbContext(DbContextOptions<BallisticsDbContext> options)
        : base(options)
    {
    }

    public DbSet<Cartridge> Cartridges => Set<Cartridge>();
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("ballistics");
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(BallisticsDbContext).Assembly);
    }
}
