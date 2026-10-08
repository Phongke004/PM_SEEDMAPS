using AppApi.DTO.Roles;
using AppApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AppApi.WebApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class RolesController : ControllerBase
{
    private readonly IRolePermissionService _roleService;

    public RolesController(IRolePermissionService roleService)
    {
        _roleService = roleService;
    }

    [HttpGet]
    public async Task<IActionResult> GetRoles()
    {
        var roles = await _roleService.GetAllRolesAsync();
        return Ok(roles);
    }

    [HttpGet("mappings")]
    public async Task<IActionResult> GetApiRoleMappings()
    {
        var mappings = await _roleService.GetAllMappingsAsync();
        return Ok(mappings);
    }

    [HttpPut("mappings/{id:guid}")]
    public async Task<IActionResult> UpdateMapping(Guid id, [FromBody] UpdateApiRoleMappingRequest request)
    {
        var success = await _roleService.UpdateApiRoleMappingAsync(id, request.RoleId);
        if (!success) return BadRequest(new { message = "Không thể cập nhật cấu hình quyền cho endpoint." });
        return Ok(new { message = "Cập nhật Role Mapping thành công." });
    }

    [HttpGet("modules")]
    public async Task<IActionResult> GetAllModulesWithFunctions()
    {
        var modules = await _roleService.GetAllModulesWithFunctionsAsync();
        return Ok(modules);
    }

    [HttpGet("{roleId:guid}/permissions")]
    public async Task<IActionResult> GetRolePermissions(Guid roleId)
    {
        var functionIds = await _roleService.GetRoleFunctionIdsAsync(roleId);
        return Ok(functionIds);
    }

    [HttpPut("{roleId:guid}/permissions")]
    public async Task<IActionResult> UpdateRolePermissions(Guid roleId, [FromBody] DTO.RBAC.RolePermissionUpdateDto request)
    {
        if (roleId != request.RoleId) return BadRequest();
        var success = await _roleService.UpdateRoleFunctionsAsync(request);
        if (!success) return BadRequest();
        return Ok(new { message = "Cập nhật phân quyền thành công." });
    }
}
