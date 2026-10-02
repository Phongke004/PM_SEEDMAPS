using AppApi.DTO.Halls;
using AppApi.DTO.Seats;
using AppApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AppApi.WebApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class HallsController : ControllerBase
{
    private readonly IHallService _hallService;
    private readonly ISeatService _seatService;

    public HallsController(IHallService hallService, ISeatService seatService)
    {
        _hallService = hallService;
        _seatService = seatService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var halls = await _hallService.GetAllAsync();
        return Ok(halls);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var hall = await _hallService.GetByIdAsync(id);
        if (hall == null) return NotFound(new { message = "Không tìm thấy hội trường." });
        return Ok(hall);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateHallRequest request)
    {
        var created = await _hallService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateHallRequest request)
    {
        var success = await _hallService.UpdateAsync(id, request);
        if (!success) return NotFound();
        return Ok(new { message = "Cập nhật hội trường thành công." });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var success = await _hallService.DeleteAsync(id);
        if (!success) return NotFound();
        return Ok(new { message = "Đã xóa hội trường thành công." });
    }

    [HttpGet("{id:guid}/seats")]
    public async Task<IActionResult> GetSeats(Guid id)
    {
        var seats = await _seatService.GetSeatsByHallIdAsync(id);
        return Ok(seats);
    }

    [HttpPost("{id:guid}/seats/batch")]
    public async Task<IActionResult> BatchUpdateSeats(Guid id, [FromBody] BatchUpdateSeatsRequest request)
    {
        var success = await _seatService.BatchUpdateSeatsAsync(id, request);
        return Ok(new { message = "Cập nhật sơ đồ ghế thành công." });
    }
}
