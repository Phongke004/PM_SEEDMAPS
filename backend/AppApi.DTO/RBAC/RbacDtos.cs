namespace AppApi.DTO.RBAC;

public class ModuleDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public List<FunctionDto> Functions { get; set; } = new List<FunctionDto>();
}

public class FunctionDto
{
    public Guid Id { get; set; }
    public Guid ModuleId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class RolePermissionUpdateDto
{
    public Guid RoleId { get; set; }
    public List<Guid> FunctionIds { get; set; } = new List<Guid>();
}

public class AccountPermissionUpdateDto
{
    public Guid AccountId { get; set; }
    public List<Guid> FunctionIds { get; set; } = new List<Guid>();
}

