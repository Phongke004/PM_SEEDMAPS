using AppApi.Entities.Base;

namespace AppApi.Entities.Models;

/// <summary>
/// Sự kiện / buổi hội họp được tổ chức tại hội trường.
/// Tương ứng bảng <c>app_events</c> trong database.
/// </summary>
public class AppEvent : AuditEntity<Guid>
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    public Guid HallId { get; set; }
    public virtual Hall Hall { get; set; } = null!;

    public DateTime EventDate { get; set; }

    /// <summary>planning | open | assigned | completed</summary>
    public string Status { get; set; } = "planning";

    public virtual ICollection<Attendee> Attendees { get; set; } = new List<Attendee>();
    public virtual ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
}
