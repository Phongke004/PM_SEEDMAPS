using AppApi.Entities.Base;

namespace AppApi.Entities.Models;

public class Role : AuditEntity<Guid>
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    public virtual ICollection<AccountRole> AccountRoles { get; set; } = new List<AccountRole>();
    public virtual ICollection<ApiRoleMapping> ApiRoleMappings { get; set; } = new List<ApiRoleMapping>();
}
