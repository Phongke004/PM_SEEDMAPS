namespace AppApi.DTO.Assignments;

public class AssignSeatRequest
{
    public Guid EventId { get; set; }
    public Guid SeatId { get; set; }
    public Guid? AttendeeId { get; set; }
}

public class AssignmentResponse
{
    public Guid Id { get; set; }
    public Guid EventId { get; set; }
    public Guid SeatId { get; set; }
    public Guid? AttendeeId { get; set; }
    public string? AttendeeName { get; set; }
    public string? Department { get; set; }
    public string Status { get; set; } = "confirmed";
    public DateTime CreatedAt { get; set; }
}
