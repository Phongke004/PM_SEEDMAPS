using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using AutoMapper;
using AppApi.Common.Config;
using AppApi.Common.Constants;
using AppApi.DataAccess.UnitOfWork;
using AppApi.DTO.Auth;
using AppApi.Entities;
using AppApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace AppApi.Services.Implementations;

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;
    private readonly JwtSettings _jwtSettings;

    public AuthService(IUnitOfWork uow, IMapper mapper, JwtSettings jwtSettings)
    {
        _uow = uow;
        _mapper = mapper;
        _jwtSettings = jwtSettings;
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var account = await _uow.Accounts.Query()
            .Include(a => a.AccountRoles)
            .ThenInclude(ar => ar.Role)
            .FirstOrDefaultAsync(a => a.Username == request.Username && !a.IsDeleted);

        if (account == null)
            return null;

        if (account.IsLock)
        {
            if (account.TimeLock.HasValue && account.TimeLock > DateTime.UtcNow)
            {
                throw new InvalidOperationException($"Tài khoản bị tạm khóa đến {account.TimeLock.Value.ToLocalTime()} do nhập sai mật khẩu nhiều lần.");
            }
            else if (!account.TimeLock.HasValue)
            {
                throw new InvalidOperationException("Tài khoản của bạn đã bị khóa bởi quản trị viên.");
            }
        }

        if (!BCrypt.Net.BCrypt.Verify(request.Password, account.PasswordHash))
        {
            account.AccessFailedCount++;
            if (account.AccessFailedCount >= 5)
            {
                account.IsLock = true;
                account.TimeLock = DateTime.UtcNow.AddMinutes(5);
            }
            await _uow.CompleteAsync();
            return null;
        }

        // Reset lockout
        account.AccessFailedCount = 0;
        account.IsLock = false;
        account.TimeLock = null;

        var roles = account.AccountRoles.Select(r => r.Role.Name).ToList();
        
        var permissions = await GetUserPermissionsAsync(account.Id, roles);
        var (accessToken, expiresAt) = GenerateJwtToken(account, roles);
        var refreshToken = GenerateRefreshToken();

        account.RefreshToken = refreshToken;
        account.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays);
        await _uow.CompleteAsync();

        return new AuthResponse
        {
            Id = account.Id,
            Username = account.Username,
            FullName = account.FullName,
            Email = account.Email,
            Roles = roles,
            Permissions = permissions,
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = expiresAt
        };
    }

    public async Task<AuthResponse?> RefreshTokenAsync(RefreshTokenRequest request)
    {
        var principal = GetPrincipalFromExpiredToken(request.AccessToken);
        if (principal == null)
            return null;

        var username = principal.Identity?.Name;
        var account = await _uow.Accounts.Query()
            .Include(a => a.AccountRoles)
            .ThenInclude(ar => ar.Role)
            .FirstOrDefaultAsync(a => a.Username == username && !a.IsDeleted);

        if (account == null || account.RefreshToken != request.RefreshToken || account.RefreshTokenExpiryTime <= DateTime.UtcNow)
            return null;

        var roles = account.AccountRoles.Select(r => r.Role.Name).ToList();
        var permissions = await GetUserPermissionsAsync(account.Id, roles);
        var (newAccessToken, expiresAt) = GenerateJwtToken(account, roles);
        var newRefreshToken = GenerateRefreshToken();

        account.RefreshToken = newRefreshToken;
        account.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays);
        await _uow.CompleteAsync();

        return new AuthResponse
        {
            Id = account.Id,
            Username = account.Username,
            FullName = account.FullName,
            Email = account.Email,
            Roles = roles,
            Permissions = permissions,
            AccessToken = newAccessToken,
            RefreshToken = newRefreshToken,
            ExpiresAt = expiresAt
        };
    }

    public async Task<AccountResponse?> RegisterAsync(RegisterAccountRequest request)
    {
        var exists = await _uow.Accounts.Query().AnyAsync(a => a.Username == request.Username);
        if (exists)
            throw new InvalidOperationException("Tên đăng nhập đã tồn tại trong hệ thống.");

        var account = new Account
        {
            Username = request.Username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FullName = request.FullName,
            Email = request.Email,
            PhoneNumber = request.PhoneNumber,
            Department = request.Department,
            IsActive = true
        };

        if (request.RoleNames.Count == 0)
        {
            request.RoleNames.Add(CommonConstants.RoleUser);
        }

        var roles = await _uow.Roles.Query().Where(r => request.RoleNames.Contains(r.Name)).ToListAsync();
        foreach (var role in roles)
        {
            account.AccountRoles.Add(new AccountRole { Account = account, Role = role });
        }

        await _uow.Accounts.AddAsync(account);
        await _uow.CompleteAsync();

        return _mapper.Map<AccountResponse>(account);
    }

    public async Task<AccountResponse?> GetCurrentAccountAsync(Guid accountId)
    {
        var account = await _uow.Accounts.Query()
            .Include(a => a.AccountRoles)
            .ThenInclude(ar => ar.Role)
            .FirstOrDefaultAsync(a => a.Id == accountId && !a.IsDeleted);

        return account != null ? _mapper.Map<AccountResponse>(account) : null;
    }

    public async Task<IEnumerable<AccountResponse>> GetAllAccountsAsync()
    {
        var accounts = await _uow.Accounts.Query()
            .Include(a => a.AccountRoles)
            .ThenInclude(ar => ar.Role)
            .Where(a => !a.IsDeleted)
            .ToListAsync();

        return _mapper.Map<IEnumerable<AccountResponse>>(accounts);
    }

    public async Task<bool> LockAccountAsync(Guid accountId, bool isLock)
    {
        var account = await _uow.Accounts.GetByIdAsync(accountId);
        if (account == null) return false;

        account.IsLock = isLock;
        if (!isLock)
        {
            account.TimeLock = null;
            account.AccessFailedCount = 0;
        }
        else
        {
            account.TimeLock = null;
        }
        await _uow.CompleteAsync();
        return true;
    }

    public async Task<bool> UpdateProfileAsync(Guid accountId, UpdateProfileRequest request)
    {
        var account = await _uow.Accounts.GetByIdAsync(accountId);
        if (account == null) return false;

        if (!string.IsNullOrEmpty(request.FullName))
            account.FullName = request.FullName;
        
        if (request.Email != null) // allowing empty email clear
            account.Email = request.Email;

        if (!string.IsNullOrEmpty(request.NewPassword))
        {
            if (string.IsNullOrEmpty(request.CurrentPassword) || !BCrypt.Net.BCrypt.Verify(request.CurrentPassword, account.PasswordHash))
            {
                throw new InvalidOperationException("Mật khẩu hiện tại không đúng.");
            }
            account.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        }

        await _uow.CompleteAsync();
        return true;
    }

    // In-memory OTP store for demo purposes: Key = username, Value = (otp, expiry, email)
    private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, (string Otp, DateTime Expiry, string Email)> _otpCache = new();

    public async Task<string?> ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        var account = await _uow.Accounts.Query().FirstOrDefaultAsync(a => a.Username == request.Username && a.Email == request.Email);
        if (account == null) return null;

        // Sinh mã OTP 6 số
        var otp = new Random().Next(100000, 999999).ToString();
        
        // Lưu vào cache (hết hạn sau 5 phút)
        _otpCache[request.Username] = (otp, DateTime.UtcNow.AddMinutes(5), request.Email);

        // Trong thực tế, ở đây sẽ gửi email chứa OTP cho user.
        // Để demo/test, chúng ta trả về mã OTP (hoặc mock) qua API response.
        return otp;
    }

    public async Task<bool> ResetPasswordAsync(ResetPasswordRequest request)
    {
        if (!_otpCache.TryGetValue(request.Username, out var otpData))
        {
            throw new InvalidOperationException("Không tìm thấy yêu cầu đặt lại mật khẩu hoặc mã OTP đã hết hạn.");
        }

        if (otpData.Expiry < DateTime.UtcNow)
        {
            _otpCache.TryRemove(request.Username, out _);
            throw new InvalidOperationException("Mã OTP đã hết hạn.");
        }

        if (otpData.Email != request.Email || otpData.Otp != request.OtpCode)
        {
            throw new InvalidOperationException("Mã xác nhận không chính xác.");
        }

        var account = await _uow.Accounts.Query().FirstOrDefaultAsync(a => a.Username == request.Username && a.Email == request.Email);
        if (account == null) return false;

        account.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _uow.CompleteAsync();

        // Xóa OTP khỏi cache sau khi dùng
        _otpCache.TryRemove(request.Username, out _);
        
        return true;
    }

    private (string token, DateTime expiresAt) GenerateJwtToken(Account account, List<string> roles)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpirationMinutes);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, account.Id.ToString()),
            new(ClaimTypes.Name, account.Username),
            new("fullName", account.FullName),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expiresAt,
            Issuer = _jwtSettings.Issuer,
            Audience = _jwtSettings.Audience,
            SigningCredentials = creds
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return (tokenHandler.WriteToken(token), expiresAt);
    }

    private static string GenerateRefreshToken()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    private ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
    {
        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = false,
            ValidateIssuer = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey)),
            ValidateLifetime = false
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var securityToken);

        if (securityToken is not JwtSecurityToken jwtSecurityToken ||
            !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
        {
            return null;
        }

        return principal;
    }

    private async Task<List<string>> GetUserPermissionsAsync(Guid accountId, List<string> roles)
    {
        if (roles.Contains(CommonConstants.RoleAdmin, StringComparer.OrdinalIgnoreCase))
        {
            return await _uow.Functions.Query().Select(f => f.Code).ToListAsync();
        }

        var accountFunctions = await _uow.AccountFunctions.Query()
            .Where(af => af.AccountId == accountId)
            .Select(af => af.Function.Code)
            .ToListAsync();

        return accountFunctions.Distinct().ToList();
    }
    public async Task<bool> AdminResetPasswordAsync(Guid accountId, string newPassword)
    {
        var account = await _uow.Accounts.GetByIdAsync(accountId);
        if (account == null) return false;

        account.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        await _uow.CompleteAsync();
        return true;
    }

    public async Task<bool> AssignRolesAsync(Guid accountId, List<string> roleNames)
    {
        var account = await _uow.Accounts.Query().Include(a => a.AccountRoles).FirstOrDefaultAsync(a => a.Id == accountId);
        if (account == null) return false;

        // Remove old roles
        account.AccountRoles.Clear();

        // Add new roles
        var roles = await _uow.Roles.Query().Where(r => roleNames.Contains(r.Name)).ToListAsync();
        foreach (var role in roles)
        {
            account.AccountRoles.Add(new AccountRole { AccountId = account.Id, RoleId = role.Id });
        }

        await _uow.CompleteAsync();
        return true;
    }
}
