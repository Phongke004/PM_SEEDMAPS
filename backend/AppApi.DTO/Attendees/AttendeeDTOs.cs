namespace AppApi.DTO.Attendees;

public class CreateAttendeeRequest
{
    public Guid EventId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Department { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Notes { get; set; }
    public string? Title { get; set; }
    public string? Position { get; set; }
    public string? Degree { get; set; }
    public string Status { get; set; } = "pending";
}

public class UpdateAttendeeRequest
{
    public string FullName { get; set; } = string.Empty;
    public string? Department { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Notes { get; set; }
    public string? Title { get; set; }
    public string? Position { get; set; }
    public string? Degree { get; set; }
    public string Status { get; set; } = "pending";
}

public class AttendeeResponse
{
    public Guid Id { get; set; }
    public Guid EventId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Department { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Notes { get; set; }
    public string? Title { get; set; }
    public string? Position { get; set; }
    public string? Degree { get; set; }
    public string Status { get; set; } = "pending";
    public DateTime CreatedAt { get; set; }
}
