namespace AppApi.Services.Interfaces;

public interface ISeatService
{
    Task<IEnumerable<AppApi.DTO.Seats.SeatResponse>> GetSeatsByHallIdAsync(Guid hallId);
    Task<bool> BatchUpdateSeatsAsync(Guid hallId, AppApi.DTO.Seats.BatchUpdateSeatsRequest request);
}
