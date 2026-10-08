using AutoMapper;
using AppApi.DataAccess.UnitOfWork;
using AppApi.DTO.Attendees;
using AppApi.Entities;
using AppApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AppApi.Services.Implementations;

public class AttendeeService : IAttendeeService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public AttendeeService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<IEnumerable<AttendeeResponse>> GetByEventIdAsync(Guid eventId)
    {
        var attendees = await _uow.Attendees.Query()
            .Where(a => a.EventId == eventId)
            .OrderBy(a => a.FullName)
            .ToListAsync();

        return _mapper.Map<IEnumerable<AttendeeResponse>>(attendees);
    }

    public async Task<AttendeeResponse> CreateAsync(CreateAttendeeRequest request)
    {
        var attendee = _mapper.Map<Attendee>(request);
        await _uow.Attendees.AddAsync(attendee);
        await _uow.CompleteAsync();

        return _mapper.Map<AttendeeResponse>(attendee);
    }

    public async Task<bool> ImportBatchAsync(Guid eventId, IEnumerable<CreateAttendeeRequest> requests)
    {
        var attendees = _mapper.Map<IEnumerable<Attendee>>(requests);
        foreach (var att in attendees)
        {
            att.EventId = eventId;
        }
        await _uow.Attendees.AddRangeAsync(attendees);
        await _uow.CompleteAsync();
        return true;
    }

    public async Task<bool> UpdateAsync(Guid id, UpdateAttendeeRequest request)
    {
        var attendee = await _uow.Attendees.GetByIdAsync(id);
        if (attendee == null) return false;

        _mapper.Map(request, attendee);
        await _uow.CompleteAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var attendee = await _uow.Attendees.GetByIdAsync(id);
        if (attendee == null) return false;

        _uow.Attendees.Remove(attendee);
        await _uow.CompleteAsync();
        return true;
    }
}
