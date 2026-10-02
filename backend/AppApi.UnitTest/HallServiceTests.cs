using AutoMapper;
using AppApi.DataAccess;
using AppApi.DataAccess.UnitOfWork;
using AppApi.DTO.Halls;
using AppApi.Entities;
using AppApi.Mapping.Profiles;
using AppApi.Services.Implementations;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace AppApi.UnitTest;

public class HallServiceTests
{
    private readonly IMapper _mapper;

    public HallServiceTests()
    {
        var config = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<MappingProfile>();
        });
        _mapper = config.CreateMapper();
    }

    private ApplicationDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task CreateHall_ShouldCreateHallAndSeats()
    {
        // Arrange
        using var context = GetInMemoryDbContext();
        var uow = new UnitOfWork(context);
        var service = new HallService(uow, _mapper);

        var request = new CreateHallRequest
        {
            Name = "Hội trường A",
            Description = "Hội trường tiệc cưới và hội nghị",
            RowCount = 3,
            ColCount = 4
        };

        // Act
        var result = await service.CreateAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Hội trường A", result.Name);

        // UnitOfWork exposes HallElements (the created "chairs") rather than a "Seats" property.
        // Use the existing repository property for HallElement to verify created seat elements.
        var allSeats = await uow.HallElements.GetAllAsync();
        Assert.Equal(12, allSeats.Count()); // 3 x 4 = 12 seats
    }

    [Fact]
    public async Task DeleteHall_ShouldMarkAsDeleted()
    {
        // Arrange
        using var context = GetInMemoryDbContext();
        var uow = new UnitOfWork(context);
        var service = new HallService(uow, _mapper);

        // Hall entity is defined in AppApi.Entities.Models. Add explicit using or fully-qualify.
        var hall = new AppApi.Entities.Models.Hall { Name = "Hội trường B", RowCount = 2, ColCount = 2 };
        await uow.Halls.AddAsync(hall);
        await uow.CompleteAsync();

        // Act
        var deleteResult = await service.DeleteAsync(hall.Id);

        // Assert
        Assert.True(deleteResult);
        var fetchResult = await service.GetByIdAsync(hall.Id);
        Assert.Null(fetchResult);
    }
}
