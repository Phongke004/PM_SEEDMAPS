namespace AppApi.DTO.Roles;

public class RoleResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class ApiRoleMappingResponse
{
    public Guid Id { get; set; }
    public string HttpMethod { get; set; } = string.Empty;
    public string EndpointPath { get; set; } = string.Empty;
    public string? ActionName { get; set; }
    public string? ControllerName { get; set; }
    public string? Description { get; set; }
    public Guid RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
}

public class UpdateApiRoleMappingRequest
{
    public Guid RoleId { get; set; }
}
