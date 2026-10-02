using System.Security.Claims;
using AppApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;

namespace AppApi.Infrastructure.Middlewares;

public class DynamicPermissionMiddleware
{
    private readonly RequestDelegate _next;

    public DynamicPermissionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var endpoint = context.GetEndpoint();
        if (endpoint == null)
        {
            await _next(context);
            return;
        }

        // Nếu endpoint có [AllowAnonymous], bỏ qua kiểm tra
        var allowAnonymous = endpoint.Metadata.GetMetadata<IAllowAnonymous>() != null;
        if (allowAnonymous)
        {
            await _next(context);
            return;
        }

        // Bỏ qua swagger
        var path = context.Request.Path.Value ?? string.Empty;
        if (path.StartsWith("/swagger", StringComparison.OrdinalIgnoreCase))
        {
            await _next(context);
            return;
        }

        // Nếu chưa đăng nhập
        if (!context.User.Identity?.IsAuthenticated ?? true)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await context.Response.WriteAsJsonAsync(new { message = "Bạn cần đăng nhập để truy cập tài nguyên này." });
            return;
        }

        // Lấy danh sách Roles của user
        var userRoles = context.User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();

        // Kiểm tra quyền theo bảng ApiRoleMapping
        using var scope = context.RequestServices.CreateScope();
        var rolePermissionService = scope.ServiceProvider.GetRequiredService<IRolePermissionService>();

        var routePattern = (endpoint as Microsoft.AspNetCore.Routing.RouteEndpoint)?.RoutePattern?.RawText;
        var normalizedPath = !string.IsNullOrWhiteSpace(routePattern) ? "/" + routePattern.TrimStart('/') : path;

        var hasPermission = await rolePermissionService.HasPermissionAsync(userRoles, context.Request.Method, normalizedPath);
        if (!hasPermission)
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsJsonAsync(new
            {
                message = "Bạn không có quyền (Role) phù hợp để thực thi chức năng này.",
                requiredRoleCheck = true,
                path = normalizedPath,
                method = context.Request.Method
            });
            return;
        }

        await _next(context);
    }
}
