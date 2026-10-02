using AppApi.Entities.Base;

namespace AppApi.Entities.Models;

/// <summary>
/// Hội trường / Khán phòng.
/// Tương ứng bảng <c>halls</c> trong database.
/// </summary>
public class Hall : AuditEntity<Guid>
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int RowCount { get; set; }
    public int ColCount { get; set; }

    public virtual ICollection<HallElement> HallElements { get; set; } = new List<HallElement>();
    public virtual ICollection<AppEvent> Events { get; set; } = new List<AppEvent>();
}
