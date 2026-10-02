namespace AppApi.Services.Interfaces;

public interface IHallService
{
    Task<IEnumerable<AppApi.DTO.Halls.HallResponse>> GetAllAsync();
    Task<AppApi.DTO.Halls.HallResponse?> GetByIdAsync(Guid id);
    Task<AppApi.DTO.Halls.HallResponse> CreateAsync(AppApi.DTO.Halls.CreateHallRequest request);
    Task<bool> UpdateAsync(Guid id, AppApi.DTO.Halls.UpdateHallRequest request);
    Task<bool> DeleteAsync(Guid id);
}
