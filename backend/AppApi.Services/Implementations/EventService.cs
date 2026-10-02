using AutoMapper;
using AppApi.DataAccess.UnitOfWork;
using AppApi.DTO.Events;
using AppApi.Entities;
using AppApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AppApi.Services.Implementations;

public class EventService : IEventService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public EventService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<IEnumerable<EventResponse>> GetAllAsync()
    {
        var events = await _uow.Events.Query()
            .Include(e => e.Hall)
            .Include(e => e.Attendees)
            .Include(e => e.Assignments)
            .OrderByDescending(e => e.EventDate)
            .ToListAsync();

        return _mapper.Map<IEnumerable<EventResponse>>(events);
    }

    public async Task<EventResponse?> GetByIdAsync(Guid id)
    {
        var ev = await _uow.Events.Query()
            .Include(e => e.Hall)
            .Include(e => e.Attendees)
            .Include(e => e.Assignments)
            .FirstOrDefaultAsync(e => e.Id == id);

        return ev != null ? _mapper.Map<EventResponse>(ev) : null;
    }

    public async Task<EventResponse> CreateAsync(CreateEventRequest request)
    {
        var ev = _mapper.Map<AppEvent>(request);
        await _uow.Events.AddAsync(ev);
        await _uow.CompleteAsync();

        return _mapper.Map<EventResponse>(ev);
    }

    public async Task<bool> UpdateAsync(Guid id, UpdateEventRequest request)
    {
        var ev = await _uow.Events.GetByIdAsync(id);
        if (ev == null) return false;

        // Validate referenced Hall exists to avoid FK constraint violation
        var hall = await _uow.Halls.GetByIdAsync(request.HallId);
        if (hall == null || hall.IsDeleted)
        {
            // Return false so controller returns 404 NotFound for invalid Hall reference
            return false;
        }

        _mapper.Map(request, ev);
        ev.UpdatedAt = DateTime.UtcNow;
        await _uow.CompleteAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var ev = await _uow.Events.GetByIdAsync(id);
        if (ev == null) return false;

        _uow.Events.Remove(ev);
        await _uow.CompleteAsync();
        return true;
    }
}
