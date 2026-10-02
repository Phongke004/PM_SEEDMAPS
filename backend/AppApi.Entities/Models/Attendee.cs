using AppApi.Entities.Base;

namespace AppApi.Entities.Models;

/// <summary>
/// Đại biểu / Khách mời tham dự sự kiện.
/// Tương ứng bảng <c>attendees</c> trong database.
/// </summary>
public class Attendee : AuditEntity<Guid>
{
    public Guid EventId { get; set; }
    public virtual AppEvent Event { get; set; } = null!;

    public string FullName { get; set; } = string.Empty;
    public string? Title { get; set; }           // Chức danh (VD: Bí thư, Chủ tịch...)
    public string? Position { get; set; }        // Chức vụ
    public string? Degree { get; set; }          // Học hàm / học vị
    public string? Department { get; set; }      // Đơn vị / phòng ban
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Notes { get; set; }

    /// <summary>pending | assigned | absent | attended</summary>
    public string Status { get; set; } = "pending";

    public virtual ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
}
