using AppApi.DataAccess.Repositories;
using AppApi.Entities;

namespace AppApi.DataAccess.UnitOfWork;

public interface IUnitOfWork : IDisposable
{
    IGenericRepository<Account> Accounts { get; }
    IGenericRepository<Role> Roles { get; }
    IGenericRepository<AccountRole> AccountRoles { get; }
    IGenericRepository<ApiRoleMapping> ApiRoleMappings { get; }

    IGenericRepository<Hall> Halls { get; }
    IGenericRepository<HallElement> HallElements { get; }
    IGenericRepository<AppEvent> Events { get; }
    IGenericRepository<Attendee> Attendees { get; }
    IGenericRepository<Assignment> Assignments { get; }

    IGenericRepository<T> Repository<T>() where T : class;
    Task<int> CompleteAsync();
}
