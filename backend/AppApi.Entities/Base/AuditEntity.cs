namespace AppApi.Entities.Base;

/// <summary>
/// Lớp cơ sở bổ sung thông tin audit (người tạo, ngày tạo, cập nhật, xóa mềm).
/// Kế thừa từ <see cref="BaseEntity{TKey}"/>.
/// </summary>
/// <typeparam name="TKey">Kiểu khóa chính (Guid, int, ...)</typeparam>
public abstract class AuditEntity<TKey> : BaseEntity<TKey>
{
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; } = false;
}
