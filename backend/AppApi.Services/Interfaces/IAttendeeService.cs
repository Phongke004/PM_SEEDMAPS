namespace AppApi.Services.Interfaces;

public interface IAttendeeService
{
    Task<IEnumerable<AppApi.DTO.Attendees.AttendeeResponse>> GetByEventIdAsync(Guid eventId);
    Task<AppApi.DTO.Attendees.AttendeeResponse> CreateAsync(AppApi.DTO.Attendees.CreateAttendeeRequest request);
    Task<bool> UpdateAsync(Guid id, AppApi.DTO.Attendees.UpdateAttendeeRequest request);
    Task<bool> DeleteAsync(Guid id);
}
