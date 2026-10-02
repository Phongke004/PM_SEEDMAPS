namespace AppApi.DTO.Events;

public class CreateEventRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid HallId { get; set; }
    public DateTime EventDate { get; set; }
    public string Status { get; set; } = "planning";
}

public class UpdateEventRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid HallId { get; set; }
    public DateTime EventDate { get; set; }
    public string Status { get; set; } = "planning";
}

public class EventResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid HallId { get; set; }
    public string? HallName { get; set; }
    public DateTime EventDate { get; set; }
    public string Status { get; set; } = "planning";
    public int AttendeeCount { get; set; }
    public int AssignedCount { get; set; }
    public DateTime CreatedAt { get; set; }
}
