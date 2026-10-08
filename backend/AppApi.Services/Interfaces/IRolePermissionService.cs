using AppApi.DTO.Roles;
using AppApi.Entities;

using AppApi.DTO.RBAC;

namespace AppApi.Services.Interfaces;

public interface IRolePermissionService
{
    Task<IEnumerable<RoleResponse>> GetAllRolesAsync();
    Task<IEnumerable<ApiRoleMappingResponse>> GetAllMappingsAsync();
    Task<bool> UpdateApiRoleMappingAsync(Guid mappingId, Guid newRoleId);
    Task SyncApiEndpointsAsync(IEnumerable<ApiRoleMapping> detectedEndpoints);
    Task<bool> HasPermissionAsync(IEnumerable<string> userRoles, string httpMethod, string endpointPath);

    // RBAC Methods
    Task<IEnumerable<ModuleDto>> GetAllModulesWithFunctionsAsync();
    Task<IEnumerable<Guid>> GetRoleFunctionIdsAsync(Guid roleId);
    Task<bool> UpdateRoleFunctionsAsync(RolePermissionUpdateDto request);
    Task<IEnumerable<Guid>> GetAccountFunctionIdsAsync(Guid accountId);
    Task<bool> UpdateAccountFunctionsAsync(AccountPermissionUpdateDto request);
}
