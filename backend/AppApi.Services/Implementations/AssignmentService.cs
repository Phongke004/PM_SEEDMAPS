using AutoMapper;
using AppApi.DataAccess.UnitOfWork;
using AppApi.DTO.Assignments;
using AppApi.Entities;
using AppApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AppApi.Services.Implementations;

public class AssignmentService : IAssignmentService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public AssignmentService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<IEnumerable<AssignmentResponse>> GetByEventIdAsync(Guid eventId)
    {
        var assignments = await _uow.Assignments.Query()
            .Include(a => a.Attendee)
            .Where(a => a.EventId == eventId)
            .ToListAsync();

        return _mapper.Map<IEnumerable<AssignmentResponse>>(assignments);
    }

    public async Task<AssignmentResponse> AssignSeatAsync(AssignSeatRequest request)
    {
        // Kiểm tra xem vị trí ghế này trong sự kiện đã được gán chưa
        var existing = await _uow.Assignments.Query()
            .FirstOrDefaultAsync(a => a.EventId == request.EventId && a.ElementId == request.SeatId);

        if (existing != null)
        {
            existing.AttendeeId = request.AttendeeId;
            existing.Status = "confirmed";
            existing.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            existing = new Assignment
            {
                EventId = request.EventId,
                ElementId = request.SeatId,
                AttendeeId = request.AttendeeId,
                Status = "confirmed"
            };
            await _uow.Assignments.AddAsync(existing);
        }

        // Cập nhật trạng thái người tham dự sang 'assigned'
        if (request.AttendeeId.HasValue)
        {
            var attendee = await _uow.Attendees.GetByIdAsync(request.AttendeeId.Value);
            if (attendee != null)
            {
                attendee.Status = "assigned";
                attendee.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _uow.CompleteAsync();

        // Load lại kèm quan hệ để map trả về đầy đủ
        await _uow.Assignments.Query()
            .Include(a => a.Attendee)
            .FirstOrDefaultAsync(a => a.Id == existing.Id);

        return _mapper.Map<AssignmentResponse>(existing);
    }

    public async Task<bool> UnassignSeatAsync(Guid eventId, Guid seatId)
    {
        var assignment = await _uow.Assignments.Query()
            .FirstOrDefaultAsync(a => a.EventId == eventId && a.ElementId == seatId);

        if (assignment == null) return false;

        if (assignment.AttendeeId.HasValue)
        {
            var attendee = await _uow.Attendees.GetByIdAsync(assignment.AttendeeId.Value);
            if (attendee != null)
            {
                attendee.Status = "pending";
                attendee.UpdatedAt = DateTime.UtcNow;
            }
        }

        _uow.Assignments.Remove(assignment);
        await _uow.CompleteAsync();
        return true;
    }

    public async Task<bool> ClearAllAssignmentsAsync(Guid eventId)
    {
        var assignments = await _uow.Assignments.Query()
            .Where(a => a.EventId == eventId)
            .ToListAsync();

        var attendeeIds = assignments.Where(a => a.AttendeeId.HasValue).Select(a => a.AttendeeId!.Value).ToList();
        var attendees = await _uow.Attendees.Query()
            .Where(a => attendeeIds.Contains(a.Id))
            .ToListAsync();

        foreach (var attendee in attendees)
        {
            attendee.Status = "pending";
        }

        _uow.Assignments.RemoveRange(assignments);
        await _uow.CompleteAsync();
        return true;
    }

    public async Task<int> AutoAssignAsync(Guid eventId, string mode)
    {
        var ev = await _uow.Events.GetByIdAsync(eventId);
        if (ev == null) return 0;

        var attendees = await _uow.Attendees.Query()
            .Where(a => a.EventId == eventId && a.Status == "pending")
            .OrderBy(a => a.FullName)
            .ToListAsync();

        if (!attendees.Any()) return 0;

        var assignedSeats = await _uow.Assignments.Query()
            .Where(a => a.EventId == eventId)
            .Select(a => a.ElementId)
            .ToListAsync();

        // Need access to HallElements (Seats). Using generic repository if Seats not in IUnitOfWork.
        // Assuming _uow has HallElements
        var availableSeats = await _uow.HallElements.Query()
            .Where(e => e.HallId == ev.HallId && e.ElementType == "chair" && !assignedSeats.Contains(e.Id))
            .OrderBy(e => e.Y).ThenBy(e => e.X)
            .ToListAsync();

        int assignedCount = 0;
        foreach (var attendee in attendees)
        {
            if (assignedCount >= availableSeats.Count) break;

            var seat = availableSeats[assignedCount];
            var assignment = new Assignment
            {
                EventId = eventId,
                ElementId = seat.Id,
                AttendeeId = attendee.Id,
                Status = "confirmed"
            };
            
            attendee.Status = "assigned";
            await _uow.Assignments.AddAsync(assignment);
            
            assignedCount++;
        }

        await _uow.CompleteAsync();
        return assignedCount;
    }
}
