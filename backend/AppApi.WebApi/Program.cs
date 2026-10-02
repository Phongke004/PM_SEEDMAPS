using AppApi.DataAccess;
using AppApi.Infrastructure.Extensions;

var builder = WebApplication.CreateBuilder(args);

// 1. Services configuration
builder.Services.AddControllers();
builder.Services.InitCors("DefaultCorsPolicy");
builder.Services.InitSqlServer<ApplicationDbContext>(builder.Configuration);
builder.Services.InitJwtAuthentication(builder.Configuration);
builder.Services.InitMapping();
builder.Services.InitApplicationServices();
builder.Services.InitSwagger("WebApi - Seat Mapping Management", "v1");

var app = builder.Build();

// 2. HTTP Request Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "AppApi.WebApi v1");
    });
}

app.UseRouting();

// 3. Sử dụng Extensions toàn diện: Migrations, Seed admin/roles, Cors, Auth & Dynamic Roles Middleware
app.UseAllMiddlewares<ApplicationDbContext>();

app.MapControllers();

// 4. Tự động đồng bộ các Endpoint của Controller vào bảng ApiRoleMapping (Role Admin mặc định)
var endpointDataSource = app.Services.GetRequiredService<EndpointDataSource>();
await app.SyncApiRoleMappingsAsync(endpointDataSource);

app.Run();
