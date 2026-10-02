using AppApi.Entities.Base;

namespace AppApi.Entities.Models;

/// <summary>
/// Phần tử trong sơ đồ hội trường (ghế, bàn, sân khấu, cửa, vách, khu vực...).
/// Tương ứng bảng <c>hall_elements</c> trong database.
/// </summary>
public class HallElement : BaseEntity<Guid>
{
    public Guid HallId { get; set; }
    public virtual Hall Hall { get; set; } = null!;

    /// <summary>chair | table | stage | door | wall | zone</summary>
    public string ElementType { get; set; } = "chair";

    public decimal X { get; set; }
    public decimal Y { get; set; }
    public decimal? Width { get; set; }
    public decimal? Height { get; set; }
    public decimal? Rotation { get; set; }
    public string? Label { get; set; }

    /// <summary>delegate | guest</summary>
    public string? SeatType { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
}
