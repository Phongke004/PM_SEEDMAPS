using AutoMapper;
using AppApi.DataAccess.UnitOfWork;
using AppApi.DTO.Halls;
using AppApi.Entities;
using AppApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AppApi.Services.Implementations;

public class HallService : IHallService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public HallService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<IEnumerable<HallResponse>> GetAllAsync()
    {
        var halls = await _uow.Halls.Query()
            .OrderByDescending(h => h.CreatedAt)
            .ToListAsync();
        return _mapper.Map<IEnumerable<HallResponse>>(halls);
    }

    public async Task<HallResponse?> GetByIdAsync(Guid id)
    {
        var hall = await _uow.Halls.GetByIdAsync(id);
        if (hall == null) return null;
        return _mapper.Map<HallResponse>(hall);
    }

    public async Task<HallResponse> CreateAsync(CreateHallRequest request)
    {
        var hall = _mapper.Map<Hall>(request);
        await _uow.Halls.AddAsync(hall);

        // Sinh tự động danh sách ghế theo số hàng & số cột
        for (int r = 0; r < hall.RowCount; r++)
        {
            var rowLetter = ((char)('A' + r)).ToString();
            for (int c = 0; c < hall.ColCount; c++)
            {
                var element = new HallElement
                {
                    Hall = hall,
                    ElementType = "chair",
                    Label = $"{rowLetter}{c + 1}",
                    SeatType = "delegate",
                    X = c * 50,
                    Y = r * 50,
                    CreatedAt = DateTime.UtcNow

                };
                hall.HallElements.Add(element);
            }
        }

        await _uow.CompleteAsync();
        return _mapper.Map<HallResponse>(hall);
    }

    public async Task<bool> UpdateAsync(Guid id, UpdateHallRequest request)
    {
        var hall = await _uow.Halls.GetByIdAsync(id);
        if (hall == null) return false;

        _mapper.Map(request, hall);
        hall.UpdatedAt = DateTime.UtcNow;
        await _uow.CompleteAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var hall = await _uow.Halls.GetByIdAsync(id);
        if (hall == null) return false;

        _uow.Halls.Remove(hall);
        await _uow.CompleteAsync();
        return true;
    }
}
