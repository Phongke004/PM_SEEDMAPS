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

        // 3. Seed Modules & Functions cho màn hình Phân quyền
        var modulesData = new List<(string Code, string Name, string Desc, List<(string FCode, string FName)> Functions)>
        {
            ("USER_MGT", "Quản lý người dùng", "Module quản lý tài khoản và người dùng", new List<(string, string)>
            {
                ("USER_VIEW", "Xem danh sách người dùng"),
                ("USER_CREATE", "Tạo người dùng"),
                ("USER_EDIT", "Sửa người dùng"),
                ("USER_DELETE", "Xóa người dùng")
            }),
            ("EVENT_MGT", "Quản lý sự kiện", "Module quản lý sự kiện", new List<(string, string)>
            {
                ("EVENT_VIEW", "Xem danh sách sự kiện"),
                ("EVENT_CREATE", "Tạo sự kiện"),
                ("EVENT_EDIT", "Sửa sự kiện"),
                ("EVENT_DELETE", "Xóa sự kiện")
            }),
            ("SYS_MGT", "Quản trị hệ thống", "Module thiết lập hệ thống", new List<(string, string)>
            {
                ("SYS_SETTING", "Cấu hình hệ thống"),
                ("SYS_ROLE", "Phân quyền role và user")
            }),
            ("HALL_MGT", "Quản lý hội trường", "Module quản lý hội trường và sơ đồ", new List<(string, string)>
            {
                ("HALL_VIEW", "Xem danh sách hội trường"),
                ("HALL_CREATE", "Tạo hội trường"),
                ("HALL_UPDATE", "Cập nhật hội trường"),
                ("HALL_DELETE", "Xóa hội trường"),
                ("HALL_DESIGN", "Thiết kế sơ đồ")
            }),
            ("ATTENDEE_MGT", "Quản lý người tham dự", "Module quản lý khách mời", new List<(string, string)>
            {
                ("ATTENDEE_VIEW", "Xem danh sách khách mời"),
                ("ATTENDEE_CREATE", "Thêm khách mời"),
                ("ATTENDEE_UPDATE", "Sửa khách mời"),
                ("ATTENDEE_DELETE", "Xóa khách mời")
            }),
            ("ASSIGNMENT_MGT", "Bố trí chỗ ngồi", "Module phân công vị trí", new List<(string, string)>
            {
                ("ASSIGN_VIEW", "Xem sơ đồ bố trí"),
                ("ASSIGN_UPDATE", "Thực hiện bố trí chỗ")
            }),
            ("PRESENTATION_MGT", "Trình chiếu sơ đồ", "Module màn hình LED", new List<(string, string)>
            {
                ("PRESENTATION_VIEW", "Hiển thị trình chiếu")
            })
        };

        foreach (var mData in modulesData)
        {
            var module = context.Modules.FirstOrDefault(m => m.Code == mData.Code);
            if (module == null)
            {
                module = new AppModule { Code = mData.Code, Name = mData.Name, Description = mData.Desc };
                context.Modules.Add(module);
                context.SaveChanges();
            }

            foreach (var fData in mData.Functions)
            {
                var func = context.Functions.FirstOrDefault(f => f.Code == fData.FCode);
                if (func == null)
                {
                    func = new AppFunction { ModuleId = module.Id, Code = fData.FCode, Name = fData.FName };
                    context.Functions.Add(func);
                }
            }
        }
        context.SaveChanges();

        // 4. Đảm bảo tài khoản "admin" có full quyền trong bảng AccountFunctions (để hiển thị full tick trên UI)
        var adminUser = context.Accounts.FirstOrDefault(a => a.Username == "admin");
        if (adminUser != null)
        {
            var allFunctionIds = context.Functions.Select(f => f.Id).ToList();
            var existingAccountFunctions = context.AccountFunctions.Where(af => af.AccountId == adminUser.Id).Select(af => af.FunctionId).ToList();
            
            var missingFunctionIds = allFunctionIds.Except(existingAccountFunctions).ToList();
            if (missingFunctionIds.Any())
            {
                foreach (var funcId in missingFunctionIds)
                {
                    context.AccountFunctions.Add(new AccountFunction
                    {
                        AccountId = adminUser.Id,
                        FunctionId = funcId
                    });
                }
                context.SaveChanges();
            }
        }
    }
}
