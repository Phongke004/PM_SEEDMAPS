using AutoMapper;
using AppApi.DTO.Assignments;
using AppApi.DTO.Attendees;
using AppApi.DTO.Auth;
using AppApi.DTO.Events;
using AppApi.DTO.Halls;
using AppApi.DTO.Roles;
using AppApi.DTO.Seats;
using AppApi.Entities;

namespace AppApi.Mapping.Profiles;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // Account
        CreateMap<Account, AccountResponse>()
            .ForMember(dest => dest.Roles, opt => opt.MapFrom(src => src.AccountRoles.Select(ar => ar.Role.Name)));
        CreateMap<RegisterAccountRequest, Account>()
            .ForMember(dest => dest.PasswordHash, opt => opt.Ignore());

        // Role & ApiRoleMapping
        CreateMap<Role, RoleResponse>();
        CreateMap<ApiRoleMapping, ApiRoleMappingResponse>()
            .ForMember(dest => dest.RoleName, opt => opt.MapFrom(src => src.Role != null ? src.Role.Name : string.Empty));

        // Hall
        CreateMap<Hall, HallResponse>()
            .ForMember(dest => dest.ElementCount, opt => opt.MapFrom(src => src.HallElements.Count))
            .ForMember(dest => dest.ChairCount, opt => opt.MapFrom(src => src.HallElements.Count(e => e.ElementType == "chair")))
            .ForMember(dest => dest.EventCount, opt => opt.MapFrom(src => src.Events.Count));
        CreateMap<CreateHallRequest, Hall>();
        CreateMap<UpdateHallRequest, Hall>();

        // HallElement (maps to SeatResponse DTOs for backward-compat)
        CreateMap<HallElement, SeatResponse>();
        CreateMap<UpdateSeatRequest, HallElement>();
        CreateMap<UpdateSeatItem, HallElement>();

        // Event
        CreateMap<AppEvent, EventResponse>()
            .ForMember(dest => dest.HallName, opt => opt.MapFrom(src => src.Hall != null ? src.Hall.Name : null))
            .ForMember(dest => dest.AttendeeCount, opt => opt.MapFrom(src => src.Attendees.Count))
            .ForMember(dest => dest.AssignedCount, opt => opt.MapFrom(src => src.Assignments.Count(a => a.AttendeeId != null)));
        CreateMap<CreateEventRequest, AppEvent>();
        CreateMap<UpdateEventRequest, AppEvent>();

        // Attendee
        CreateMap<Attendee, AttendeeResponse>();
        CreateMap<CreateAttendeeRequest, Attendee>();
        CreateMap<UpdateAttendeeRequest, Attendee>();

        // Assignment
        CreateMap<Assignment, AssignmentResponse>()
            .ForMember(dest => dest.AttendeeName, opt => opt.MapFrom(src => src.Attendee != null ? src.Attendee.FullName : null))
            .ForMember(dest => dest.Department, opt => opt.MapFrom(src => src.Attendee != null ? src.Attendee.Department : null));
    }
}
