using BallisticsCalculator.Core.Models;

namespace BallisticsCalculator.Core.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByIdAsync(int id);
    Task<User> CreateAsync(User user);
    Task<bool> EmailExistsAsync(string email);
    Task<RefreshToken> CreateRefreshTokenAsync(int userId, string token, DateTime expiresAt);
    Task<RefreshToken?> GetRefreshTokenAsync(string token);
    Task RevokeRefreshTokenAsync(string token);
    Task RevokeAllUserRefreshTokensAsync(int userId);
}
