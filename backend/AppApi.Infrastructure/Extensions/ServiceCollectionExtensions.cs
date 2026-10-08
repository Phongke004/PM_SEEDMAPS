using System.Text;
using AppApi.Common.Config;
using AppApi.DataAccess;
using AppApi.DataAccess.UnitOfWork;
using AppApi.Mapping.Profiles;
using AppApi.Services.Implementations;
using AppApi.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

namespace AppApi.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection InitCors(this IServiceCollection services, string policyName = "DefaultCorsPolicy")
    {
        services.AddCors(options =>
        {
            options.AddPolicy(policyName, builder =>
            {
                builder.AllowAnyOrigin()
                       .AllowAnyMethod()
                       .AllowAnyHeader();
            });
        });
        return services;
    }

    public static IServiceCollection InitSqlServer<TContext>(this IServiceCollection services, IConfiguration configuration, string connectionName = "WebApiConnection") 
        where TContext : DbContext
    {
        var connectionString = configuration.GetConnectionString(connectionName) 
                               ?? configuration["ConnectionStrings:WebApiConnection"]
                               ?? "Server=(localdb)\\MSSQLLocalDB;Database=SeatMapDB;User Id=phongdangxuan;Password=Phong004@;TrustServerCertificate=True;";

        services.AddDbContext<TContext>(options =>
        {
            options.UseSqlServer(connectionString);
        });

        return services;
    }

    public static IServiceCollection InitJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        var jwtSettings = new JwtSettings();
        configuration.GetSection("JwtSettings").Bind(jwtSettings);
        services.AddSingleton(jwtSettings);

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = false;
            options.SaveToken = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = jwtSettings.Issuer,
                ValidateAudience = true,
                ValidAudience = jwtSettings.Audience,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey)),
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };
        });

        services.AddAuthorization();
        return services;
    }

    public static IServiceCollection InitSwagger(this IServiceCollection services, string title = "AppApi.WebApi", string version = "v1")
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc(version, new OpenApiInfo { Title = title, Version = version });

            c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Description = "JWT Authorization header sử dụng chuẩn Bearer. Ví dụ: \"Authorization: Bearer {token}\"",
                Name = "Authorization",
                In = ParameterLocation.Header,
                Type = SecuritySchemeType.ApiKey,
                Scheme = "Bearer"
            });

            c.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    Array.Empty<string>()
                }
            });
        });

        return services;
    }

    public static IServiceCollection InitMapping(this IServiceCollection services)
    {
        services.AddAutoMapper(typeof(MappingProfile).Assembly);
        return services;
    }

    public static IServiceCollection InitApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IRolePermissionService, RolePermissionService>();
        services.AddScoped<IHallService, HallService>();
        services.AddScoped<ISeatService, HallElementService>();
        services.AddScoped<IEventService, EventService>();
        services.AddScoped<IAttendeeService, AttendeeService>();
        services.AddScoped<IAssignmentService, AssignmentService>();

        return services;
    }
}
