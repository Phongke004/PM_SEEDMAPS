param(
    [string]$MigrationName = "InitialCreate"
)

Write-Host "Creating migration: $MigrationName..." -ForegroundColor Cyan
dotnet ef migrations add $MigrationName --project AppApi.DataAccess/AppApi.DataAccess.csproj --startup-project AppApi.WebApi/AppApi.WebApi.csproj --context ApplicationDbContext --output-dir Migrations
Write-Host "Migration $MigrationName created successfully!" -ForegroundColor Green
