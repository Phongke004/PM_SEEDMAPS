using AppApi.Entities.Base;

namespace AppApi.Entities.Models;

/// <summary>
/// Phân công chỗ ngồi cho đại biểu trong sự kiện.
/// Tương ứng bảng <c>assignments</c> trong database.
/// </summary>
public class Assignment : AuditEntity<Guid>
{
    public Guid EventId { get; set; }
    public virtual AppEvent Event { get; set; } = null!;

    /// <summary>Phần tử ghế ngồi (HallElement) được phân công.</summary>
    public Guid ElementId { get; set; }
    public virtual HallElement Element { get; set; } = null!;

    public Guid? AttendeeId { get; set; }
    public virtual Attendee? Attendee { get; set; }

    /// <summary>confirmed | cancelled</summary>
    public string Status { get; set; } = "confirmed";
}
