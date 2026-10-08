using AutoMapper;
using AppApi.DataAccess.UnitOfWork;
using AppApi.DTO.Seats;
using AppApi.Entities;
using AppApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AppApi.Services.Implementations;

public class HallElementService : ISeatService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public HallElementService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public async Task<IEnumerable<SeatResponse>> GetSeatsByHallIdAsync(Guid hallId)
    {
        var elements = await _uow.HallElements.Query()
            .Where(e => e.HallId == hallId)
            .OrderBy(e => e.Y)
            .ThenBy(e => e.X)
            .ToListAsync();
        return _mapper.Map<IEnumerable<SeatResponse>>(elements);
    }

    public async Task<bool> BatchUpdateSeatsAsync(Guid hallId, BatchUpdateSeatsRequest request)
    {
        var existing = await _uow.HallElements.Query()
            .Where(e => e.HallId == hallId)
            .ToDictionaryAsync(e => e.Id);

        foreach (var item in request.Seats)
        {
            if (item.Id.HasValue && existing.TryGetValue(item.Id.Value, out var elem))
            {
                elem.Label = item.Label;
                elem.SeatType = item.SeatType;
                elem.ElementType = string.IsNullOrEmpty(item.ElementType) ? "chair" : item.ElementType;
                elem.X = item.X;
                elem.Y = item.Y;
                elem.Width = item.Width;
                elem.Height = item.Height;
                elem.Rotation = item.Rotation;

                existing.Remove(item.Id.Value);
            }
            else
            {
                var newElem = new HallElement
                {
                    HallId = hallId,
                    ElementType = string.IsNullOrEmpty(item.ElementType) ? "chair" : item.ElementType,
                    Label = item.Label,
                    SeatType = item.SeatType,
                    X = item.X,
                    Y = item.Y,
                    Width = item.Width,
                    Height = item.Height,
                    Rotation = item.Rotation,
                };
                await _uow.HallElements.AddAsync(newElem);
            }
        }

        foreach (var elemToRemove in existing.Values)
        {
            _uow.HallElements.Remove(elemToRemove);
        }

        await _uow.CompleteAsync();
        return true;
    }
}
