using AppApi.Entities.Base;

namespace AppApi.Entities.Models;

public class Seat : AuditEntity<Guid>
{
    public Guid HallId { get; set; }
    public virtual Hall Hall { get; set; } = null!;

    public int RowIndex { get; set; }
    public int ColIndex { get; set; }
    public string Label { get; set; } = string.Empty;
    public string SeatType { get; set; } = "delegate"; // delegate, guest, empty
    public bool IsActive { get; set; } = true;

    public virtual ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
}
