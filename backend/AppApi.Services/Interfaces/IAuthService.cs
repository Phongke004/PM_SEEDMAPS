using AppApi.DTO.Auth;
using AppApi.DTO.Roles;

namespace AppApi.Services.Interfaces;

public interface IAuthService
{
    Task<AuthResponse?> LoginAsync(LoginRequest request);
    Task<AuthResponse?> RefreshTokenAsync(RefreshTokenRequest request);
    Task<AccountResponse?> RegisterAsync(RegisterAccountRequest request);
    Task<AccountResponse?> GetCurrentAccountAsync(Guid accountId);
    Task<IEnumerable<AccountResponse>> GetAllAccountsAsync();
    Task<bool> LockAccountAsync(Guid accountId, bool isLock);
    Task<bool> UpdateProfileAsync(Guid accountId, UpdateProfileRequest request);
    Task<string?> ForgotPasswordAsync(ForgotPasswordRequest request);
    Task<bool> ResetPasswordAsync(ResetPasswordRequest request);
    Task<bool> AdminResetPasswordAsync(Guid accountId, string newPassword);
    Task<bool> AssignRolesAsync(Guid accountId, List<string> roleNames);
}
