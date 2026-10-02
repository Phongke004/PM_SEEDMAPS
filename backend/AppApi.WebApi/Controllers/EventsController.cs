using AppApi.DTO.Assignments;
using AppApi.DTO.Attendees;
using AppApi.DTO.Events;
using AppApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AppApi.WebApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class EventsController : ControllerBase
{
    private readonly IEventService _eventService;
    private readonly IAttendeeService _attendeeService;
    private readonly IAssignmentService _assignmentService;

    public EventsController(IEventService eventService, IAttendeeService attendeeService, IAssignmentService assignmentService)
    {
        _eventService = eventService;
        _attendeeService = attendeeService;
        _assignmentService = assignmentService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var events = await _eventService.GetAllAsync();
        return Ok(events);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var ev = await _eventService.GetByIdAsync(id);
        if (ev == null) return NotFound(new { message = "Không tìm thấy sự kiện." });
        return Ok(ev);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateEventRequest request)
    {
        var created = await _eventService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateEventRequest request)
    {
        var success = await _eventService.UpdateAsync(id, request);
        if (!success) return NotFound();
        return Ok(new { message = "Cập nhật sự kiện thành công." });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var success = await _eventService.DeleteAsync(id);
        if (!success) return NotFound();
        return Ok(new { message = "Xóa sự kiện thành công." });
    }

    // Attendees under Event
    [HttpGet("{id:guid}/attendees")]
    public async Task<IActionResult> GetAttendees(Guid id)
    {
        var attendees = await _attendeeService.GetByEventIdAsync(id);
        return Ok(attendees);
    }

    [HttpPost("{id:guid}/attendees")]
    public async Task<IActionResult> AddAttendee(Guid id, [FromBody] CreateAttendeeRequest request)
    {
        request.EventId = id;
        var created = await _attendeeService.CreateAsync(request);
        return Ok(created);
    }

    // Assignments under Event
    [HttpGet("{id:guid}/assignments")]
    public async Task<IActionResult> GetAssignments(Guid id)
    {
        var assignments = await _assignmentService.GetByEventIdAsync(id);
        return Ok(assignments);
    }

    [HttpPost("{id:guid}/assignments")]
    public async Task<IActionResult> AssignSeat(Guid id, [FromBody] AssignSeatRequest request)
    {
        request.EventId = id;
        var assignment = await _assignmentService.AssignSeatAsync(request);
        return Ok(assignment);
    }

    [HttpDelete("{id:guid}/assignments/{seatId:guid}")]
    public async Task<IActionResult> UnassignSeat(Guid id, Guid seatId)
    {
        var success = await _assignmentService.UnassignSeatAsync(id, seatId);
        if (!success) return NotFound();
        return Ok(new { message = "Hủy gán vị trí ghế thành công." });
    }

    [HttpDelete("{id:guid}/assignments")]
    public async Task<IActionResult> ClearAllAssignments(Guid id)
    {
        var success = await _assignmentService.ClearAllAssignmentsAsync(id);
        return Ok(new { message = "Xóa toàn bộ gán chỗ sự kiện thành công." });
    }
}
