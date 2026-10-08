using AppApi.Entities.Base;

namespace AppApi.Entities.Models;

public class AppFunction : AuditEntity<Guid>
{
    public Guid ModuleId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    public virtual AppModule Module { get; set; } = null!;
    public virtual ICollection<RoleFunction> RoleFunctions { get; set; } = new List<RoleFunction>();
    public virtual ICollection<AccountFunction> AccountFunctions { get; set; } = new List<AccountFunction>();
}
