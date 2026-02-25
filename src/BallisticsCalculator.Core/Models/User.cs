namespace BallisticsCalculator.Core.Models;

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? PasswordHash { get; set; }        // null for SSO-only accounts
    public string Provider { get; set; } = "local";  // "local" | "google" | "github"
    public string? ProviderId { get; set; }           // null for local accounts
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
