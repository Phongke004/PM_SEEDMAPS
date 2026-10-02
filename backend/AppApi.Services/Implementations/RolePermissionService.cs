using AutoMapper;
using AppApi.Common.Constants;
using AppApi.DataAccess.UnitOfWork;
using AppApi.DTO.Roles;
using AppApi.Entities;
using AppApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AppApi.Services.Implementations;

public class RolePermissionService : IRolePermissionService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public RolePermissionService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<IEnumerable<RoleResponse>> GetAllRolesAsync()
    {
        var roles = await _uow.Roles.GetAllAsync();
        return _mapper.Map<IEnumerable<RoleResponse>>(roles);
    }

    public async Task<IEnumerable<ApiRoleMappingResponse>> GetAllMappingsAsync()
    {
        var mappings = await _uow.ApiRoleMappings.Query()
            .Include(m => m.Role)
            .OrderBy(m => m.ControllerName)
            .ThenBy(m => m.EndpointPath)
            .ToListAsync();

        return _mapper.Map<IEnumerable<ApiRoleMappingResponse>>(mappings);
    }

    public async Task<bool> UpdateApiRoleMappingAsync(Guid mappingId, Guid newRoleId)
    {
        var mapping = await _uow.ApiRoleMappings.GetByIdAsync(mappingId);
        if (mapping == null) return false;

        var role = await _uow.Roles.GetByIdAsync(newRoleId);
        if (role == null) return false;

        mapping.RoleId = newRoleId;
        mapping.UpdatedAt = DateTime.UtcNow;
        await _uow.CompleteAsync();
        return true;
    }

    public async Task SyncApiEndpointsAsync(IEnumerable<ApiRoleMapping> detectedEndpoints)
    {
        var adminRole = await _uow.Roles.Query().FirstOrDefaultAsync(r => r.Name == CommonConstants.RoleAdmin);
        if (adminRole == null)
        {
            adminRole = new Role { Name = CommonConstants.RoleAdmin, Description = "Quản trị viên hệ thống" };
            await _uow.Roles.AddAsync(adminRole);
            await _uow.CompleteAsync();
        }

        var existingMappings = await _uow.ApiRoleMappings.GetAllAsync();
        var existingSet = existingMappings.ToDictionary(
            x => $"{x.HttpMethod.ToUpperInvariant()}:{x.EndpointPath.ToLowerInvariant()}",
            x => x
        );

        foreach (var endpoint in detectedEndpoints)
        {
            var key = $"{endpoint.HttpMethod.ToUpperInvariant()}:{endpoint.EndpointPath.ToLowerInvariant()}";
            if (!existingSet.ContainsKey(key))
            {
                endpoint.RoleId = adminRole.Id; // Mặc định gán quyền Admin khi endpoint mới sinh ra
                await _uow.ApiRoleMappings.AddAsync(endpoint);
            }
            else
            {
                // Cập nhật thông tin action/controller/description nếu có thay đổi
                var current = existingSet[key];
                current.ActionName = endpoint.ActionName;
                current.ControllerName = endpoint.ControllerName;
                current.Description = endpoint.Description;
            }
        }

        await _uow.CompleteAsync();
    }

    public async Task<bool> HasPermissionAsync(IEnumerable<string> userRoles, string httpMethod, string endpointPath)
    {
        // Admin luôn có quyền truy cập toàn bộ hệ thống
        if (userRoles.Contains(CommonConstants.RoleAdmin, StringComparer.OrdinalIgnoreCase))
        {
            return true;
        }

        var method = httpMethod.ToUpperInvariant();
        var path = endpointPath.ToLowerInvariant();

        // Tìm mapping khớp endpoint
        var mapping = await _uow.ApiRoleMappings.Query()
            .Include(m => m.Role)
            .FirstOrDefaultAsync(m => m.HttpMethod.ToUpper() == method && m.EndpointPath.ToLower() == path);

        if (mapping == null)
        {
            // Nếu chưa được cấu hình, chỉ cho Admin truy cập
            return false;
        }

        return userRoles.Contains(mapping.Role.Name, StringComparer.OrdinalIgnoreCase);
    }
}
