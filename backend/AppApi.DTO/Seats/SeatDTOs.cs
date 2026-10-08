namespace AppApi.DTO.Seats;

public class SeatResponse
{
    public Guid Id { get; set; }
    public Guid HallId { get; set; }
    public int RowIndex { get; set; }
    public int ColIndex { get; set; }
    public string ElementType { get; set; } = "chair";
    public decimal X { get; set; }
    public decimal Y { get; set; }
    public decimal? Width { get; set; }
    public decimal? Height { get; set; }
    public decimal? Rotation { get; set; }
    public string Label { get; set; } = string.Empty;
    public string SeatType { get; set; } = "delegate";
    public bool IsActive { get; set; }
}

public class UpdateSeatRequest
{
    public string Label { get; set; } = string.Empty;
    public string SeatType { get; set; } = "delegate";
    public bool IsActive { get; set; } = true;
}

public class BatchUpdateSeatsRequest
{
    public List<UpdateSeatItem> Seats { get; set; } = new();
}

public class UpdateSeatItem
{
    public Guid? Id { get; set; }
    public int RowIndex { get; set; }
    public int ColIndex { get; set; }
    public string ElementType { get; set; } = "chair";
    public decimal X { get; set; }
    public decimal Y { get; set; }
    public decimal? Width { get; set; }
    public decimal? Height { get; set; }
    public decimal? Rotation { get; set; }
    public string Label { get; set; } = string.Empty;
    public string SeatType { get; set; } = "delegate";
    public bool IsActive { get; set; } = true;
}
