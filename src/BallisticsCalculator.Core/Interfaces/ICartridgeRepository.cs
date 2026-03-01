using BallisticsCalculator.Core.Models;

namespace BallisticsCalculator.Core.Interfaces;

public interface ICartridgeRepository
{
    Task<List<Cartridge>> GetAllAsync();
    Task<Cartridge?> GetByIdAsync(int id);
    Task<List<Cartridge>> GetByIdsAsync(IEnumerable<int> ids);
}
