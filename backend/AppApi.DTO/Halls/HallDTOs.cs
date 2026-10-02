namespace AppApi.DTO.Halls;

public class CreateHallRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int RowCount { get; set; }
    public int ColCount { get; set; }
}

public class UpdateHallRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int RowCount { get; set; }
    public int ColCount { get; set; }
}

public class HallResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int RowCount { get; set; }
    public int ColCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
