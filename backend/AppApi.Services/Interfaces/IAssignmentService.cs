namespace AppApi.Services.Interfaces;

public interface IAssignmentService
{
    Task<IEnumerable<AppApi.DTO.Assignments.AssignmentResponse>> GetByEventIdAsync(Guid eventId);
    Task<AppApi.DTO.Assignments.AssignmentResponse> AssignSeatAsync(AppApi.DTO.Assignments.AssignSeatRequest request);
    Task<bool> UnassignSeatAsync(Guid eventId, Guid seatId);
    Task<bool> ClearAllAssignmentsAsync(Guid eventId);
}
