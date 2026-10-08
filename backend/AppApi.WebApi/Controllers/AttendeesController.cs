using AppApi.DTO.Attendees;
using AppApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AppApi.WebApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AttendeesController : ControllerBase
{
    private readonly IAttendeeService _attendeeService;

    public AttendeesController(IAttendeeService attendeeService)
    {
        _attendeeService = attendeeService;
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAttendeeRequest request)
    {
        var success = await _attendeeService.UpdateAsync(id, request);
        if (!success) return NotFound();
        return Ok(new { message = "Cập nhật thành công." });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var success = await _attendeeService.DeleteAsync(id);
        if (!success) return NotFound();
        return Ok(new { message = "Xóa thành công." });
    }
}
