using AppApi.Common.Constants;
using AppApi.DataAccess;
using AppApi.Entities;
using AppApi.Entities.Models;
using AppApi.Infrastructure.Middlewares;
using AppApi.Services.Interfaces;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace AppApi.Infrastructure.Extensions;

public static class ApplicationBuilderExtensions
{
    public static IApplicationBuilder UseAllMiddlewares<TContext>(this IApplicationBuilder app) where TContext : ApplicationDbContext
    {
        using (var scope = app.ApplicationServices.CreateScope())
        {
            var services = scope.ServiceProvider;
            var logger = services.GetRequiredService<ILogger<TContext>>();
            var dbContext = services.GetRequiredService<TContext>();

            try
            {
                // Tự động Apply Migrations nếu database chưa có
                dbContext.Database.Migrate();
                logger.LogInformation("Database migration applied successfully.");

                // Seed dữ liệu ban đầu
                SeedInitialData(dbContext);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Không thể tự động migrate CSDL (kiểm tra connection string SQL Server). Tiếp tục khởi động...");
            }
        }

        app.UseCors("DefaultCorsPolicy");

        app.UseAuthentication();
        app.UseAuthorization();

        // Middleware kiểm tra phân quyền động ApiRoleMapping
        app.UseMiddleware<DynamicPermissionMiddleware>();

        return app;
    }

    public static async Task SyncApiRoleMappingsAsync(this IApplicationBuilder app, EndpointDataSource endpointDataSource)
    {
        using var scope = app.ApplicationServices.CreateScope();
        var rolePermissionService = scope.ServiceProvider.GetRequiredService<IRolePermissionService>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<ApplicationDbContext>>();

        try
        {
            var detectedEndpoints = new List<ApiRoleMapping>();

            foreach (var ep in endpointDataSource.Endpoints)
            {
                if (ep is RouteEndpoint routeEndpoint)
                {
                    var actionDescriptor = routeEndpoint.Metadata.GetMetadata<ControllerActionDescriptor>();
                    if (actionDescriptor != null)
                    {
                        var httpMethodMetadata = routeEndpoint.Metadata.GetMetadata<HttpMethodMetadata>();
                        var methods = httpMethodMetadata?.HttpMethods ?? new List<string> { "GET" };
                        var routePattern = "/" + routeEndpoint.RoutePattern.RawText?.TrimStart('/');

                        foreach (var method in methods)
                        {
                            detectedEndpoints.Add(new ApiRoleMapping
                            {
                                HttpMethod = method.ToUpperInvariant(),
                                EndpointPath = routePattern.ToLowerInvariant(),
                                ControllerName = actionDescriptor.ControllerName,
                                ActionName = actionDescriptor.ActionName,
                                Description = $"{actionDescriptor.ControllerName}.{actionDescriptor.ActionName} ({method})"
                            });
                        }
                    }
                }
            }

            await rolePermissionService.SyncApiEndpointsAsync(detectedEndpoints);
            logger.LogInformation("Tự động đồng bộ {Count} API endpoints vào bảng ApiRoleMapping thành công!", detectedEndpoints.Count);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Chưa đồng bộ ApiRoleMappings do CSDL chưa khả dụng.");
        }
    }

    private static void SeedInitialData(ApplicationDbContext context)
    {
        // 1. Seed Roles
        var adminRole = context.Roles.FirstOrDefault(r => r.Name == CommonConstants.RoleAdmin);
        if (adminRole == null)
        {
            adminRole = new Role { Name = CommonConstants.RoleAdmin, Description = "Quản trị viên toàn quyền hệ thống" };
            context.Roles.Add(adminRole);
        }

        var userRole = context.Roles.FirstOrDefault(r => r.Name == CommonConstants.RoleUser);
        if (userRole == null)
        {
            userRole = new Role { Name = CommonConstants.RoleUser, Description = "Người dùng thông thường" };
            context.Roles.Add(userRole);
        }

        var managerRole = context.Roles.FirstOrDefault(r => r.Name == CommonConstants.RoleManager);
        if (managerRole == null)
        {
            managerRole = new Role { Name = CommonConstants.RoleManager, Description = "Quản lý sự kiện và sơ đồ" };
            context.Roles.Add(managerRole);
        }

        context.SaveChanges();

        // 2. Seed Admin User
        var adminAccount = context.Accounts.FirstOrDefault(a => a.Username == "admin");
        if (adminAccount == null)
        {
            adminAccount = new Account
            {
                Username = "admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                FullName = "Hệ Thống Quản Trị Viên",
                Email = "admin@system.local",
                IsActive = true
            };
            adminAccount.AccountRoles.Add(new AccountRole { Account = adminAccount, RoleId = adminRole.Id });
            context.Accounts.Add(adminAccount);
            context.SaveChanges();
        }
    }
}
