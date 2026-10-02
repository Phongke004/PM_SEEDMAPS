using AppApi.Entities.Base;

namespace AppApi.Entities.Models;

public class Account : AuditEntity<Guid>
{
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Department { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsLock { get; set; } = false;
    public DateTime? TimeLock { get; set; }
    public int AccessFailedCount { get; set; } = 0;
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTime { get; set; }

    public virtual ICollection<AccountRole> AccountRoles { get; set; } = new List<AccountRole>();
}
