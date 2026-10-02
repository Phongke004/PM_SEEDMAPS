namespace AppApi.Entities.Base;

/// <summary>
/// Lớp cơ sở chỉ chứa khóa chính.
/// </summary>
/// <typeparam name="TKey">Kiểu khóa chính (Guid, int, ...)</typeparam>
public abstract class BaseEntity<TKey>
{
    public TKey Id { get; set; } = default!;
}
