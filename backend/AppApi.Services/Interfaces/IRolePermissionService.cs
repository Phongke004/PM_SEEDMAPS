using AppApi.DTO.Roles;
using AppApi.Entities;

namespace AppApi.Services.Interfaces;

public interface IRolePermissionService
{
    Task<IEnumerable<RoleResponse>> GetAllRolesAsync();
    Task<IEnumerable<ApiRoleMappingResponse>> GetAllMappingsAsync();
    Task<bool> UpdateApiRoleMappingAsync(Guid mappingId, Guid newRoleId);
    Task SyncApiEndpointsAsync(IEnumerable<ApiRoleMapping> detectedEndpoints);
    Task<bool> HasPermissionAsync(IEnumerable<string> userRoles, string httpMethod, string endpointPath);
}
