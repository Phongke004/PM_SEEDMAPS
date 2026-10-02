namespace AppApi.Services.Interfaces;

public interface IEventService
{
    Task<IEnumerable<AppApi.DTO.Events.EventResponse>> GetAllAsync();
    Task<AppApi.DTO.Events.EventResponse?> GetByIdAsync(Guid id);
    Task<AppApi.DTO.Events.EventResponse> CreateAsync(AppApi.DTO.Events.CreateEventRequest request);
    Task<bool> UpdateAsync(Guid id, AppApi.DTO.Events.UpdateEventRequest request);
    Task<bool> DeleteAsync(Guid id);
}
