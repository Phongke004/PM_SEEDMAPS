namespace AppApi.Entities.Models;

public class RoleFunction
{
    public Guid RoleId { get; set; }
    public Guid FunctionId { get; set; }

    public virtual Role Role { get; set; } = null!;
    public virtual AppFunction Function { get; set; } = null!;
}
