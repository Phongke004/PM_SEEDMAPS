namespace AppApi.Entities.Models;

public class AccountFunction
{
    public Guid AccountId { get; set; }
    public virtual Account Account { get; set; } = null!;

    public Guid FunctionId { get; set; }
    public virtual AppFunction Function { get; set; } = null!;
}
