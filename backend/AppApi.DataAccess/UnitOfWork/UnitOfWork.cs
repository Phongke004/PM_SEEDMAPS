using AppApi.DataAccess.Repositories;
using AppApi.Entities;

namespace AppApi.DataAccess.UnitOfWork;

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;
    private readonly Dictionary<Type, object> _repositories = new();

    private IGenericRepository<Account>? _accounts;
    private IGenericRepository<Role>? _roles;
    private IGenericRepository<AccountRole>? _accountRoles;
    private IGenericRepository<ApiRoleMapping>? _apiRoleMappings;

    private IGenericRepository<Hall>? _halls;
    private IGenericRepository<HallElement>? _hallElements;
    private IGenericRepository<AppEvent>? _events;
    private IGenericRepository<Attendee>? _attendees;
    private IGenericRepository<Assignment>? _assignments;

    public UnitOfWork(ApplicationDbContext context)
    {
        _context = context;
    }

    public IGenericRepository<Account> Accounts => _accounts ??= new GenericRepository<Account>(_context);
    public IGenericRepository<Role> Roles => _roles ??= new GenericRepository<Role>(_context);
    public IGenericRepository<AccountRole> AccountRoles => _accountRoles ??= new GenericRepository<AccountRole>(_context);
    public IGenericRepository<ApiRoleMapping> ApiRoleMappings => _apiRoleMappings ??= new GenericRepository<ApiRoleMapping>(_context);

    public IGenericRepository<Hall> Halls => _halls ??= new GenericRepository<Hall>(_context);
    public IGenericRepository<HallElement> HallElements => _hallElements ??= new GenericRepository<HallElement>(_context);
    public IGenericRepository<AppEvent> Events => _events ??= new GenericRepository<AppEvent>(_context);
    public IGenericRepository<Attendee> Attendees => _attendees ??= new GenericRepository<Attendee>(_context);
    public IGenericRepository<Assignment> Assignments => _assignments ??= new GenericRepository<Assignment>(_context);

    public IGenericRepository<T> Repository<T>() where T : class
    {
        var type = typeof(T);
        if (!_repositories.ContainsKey(type))
        {
            _repositories[type] = new GenericRepository<T>(_context);
        }
        return (IGenericRepository<T>)_repositories[type];
    }

    public async Task<int> CompleteAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public void Dispose()
    {
        _context.Dispose();
        GC.SuppressFinalize(this);
    }
}
