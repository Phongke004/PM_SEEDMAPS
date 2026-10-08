using AppApi.Entities.Base;

namespace AppApi.Entities.Models;

public class AppModule : AuditEntity<Guid>
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    public virtual ICollection<AppFunction> Functions { get; set; } = new List<AppFunction>();
}
