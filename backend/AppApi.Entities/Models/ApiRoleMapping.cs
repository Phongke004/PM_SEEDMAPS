using AppApi.Entities.Base;

namespace AppApi.Entities.Models;

public class ApiRoleMapping : AuditEntity<Guid>
{
    public string HttpMethod { get; set; } = string.Empty; // GET, POST, PUT, DELETE
    public string EndpointPath { get; set; } = string.Empty; // e.g. /api/halls
    public string? ActionName { get; set; }
    public string? ControllerName { get; set; }
    public string? Description { get; set; }

    public Guid RoleId { get; set; }
    public virtual Role Role { get; set; } = null!;
}
