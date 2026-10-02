Write-Host "Updating database from migrations..." -ForegroundColor Cyan
dotnet ef database update --project AppApi.DataAccess/AppApi.DataAccess.csproj --startup-project AppApi.WebApi/AppApi.WebApi.csproj --context ApplicationDbContext
Write-Host "Database updated successfully!" -ForegroundColor Green
