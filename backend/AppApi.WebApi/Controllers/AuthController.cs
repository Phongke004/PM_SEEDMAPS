using AppApi.DTO.Auth;
using AppApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AppApi.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var response = await _authService.LoginAsync(request);
            if (response == null)
            {
                return Unauthorized(new { message = "Sai tên đăng nhập hoặc mật khẩu." });
            }
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [AllowAnonymous]
    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        var response = await _authService.RefreshTokenAsync(request);
        if (response == null)
        {
            return Unauthorized(new { message = "Token không hợp lệ hoặc đã hết hạn." });
        }
        return Ok(response);
    }

    
    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterAccountRequest request)
    {
        try
        {
            var result = await _authService.RegisterAsync(request);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize]
    [HttpGet("accounts")]
    public async Task<IActionResult> GetAllAccounts()
    {
        var accounts = await _authService.GetAllAccountsAsync();
        return Ok(accounts);
    }

    [Authorize]
    [HttpPut("accounts/{id:guid}/lock")]
    public async Task<IActionResult> LockAccount(Guid id, [FromQuery] bool isLock)
    {
        var success = await _authService.LockAccountAsync(id, isLock);
        if (!success) return NotFound(new { message = "Không tìm thấy tài khoản." });
        return Ok(new { message = isLock ? "Đã khóa tài khoản thành công." : "Đã mở khóa tài khoản." });
    }

    [Authorize]
    [HttpGet("accounts/{accountId:guid}/permissions")]
    public async Task<IActionResult> GetAccountPermissions(Guid accountId, [FromServices] IRolePermissionService roleService)
    {
        var functionIds = await roleService.GetAccountFunctionIdsAsync(accountId);
        return Ok(functionIds);
    }

    [Authorize]
    [HttpPut("accounts/{accountId:guid}/permissions")]
    public async Task<IActionResult> UpdateAccountPermissions(Guid accountId, [FromBody] AppApi.DTO.RBAC.AccountPermissionUpdateDto request, [FromServices] IRolePermissionService roleService)
    {
        if (accountId != request.AccountId) return BadRequest();
        var success = await roleService.UpdateAccountFunctionsAsync(request);
        return Ok(new { message = "Cập nhật phân quyền cho User thành công." });
    }
    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var accountIdClaim = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier);
        if (accountIdClaim == null || !Guid.TryParse(accountIdClaim.Value, out var accountId))
            return Unauthorized();

        try
        {
            var success = await _authService.UpdateProfileAsync(accountId, request);
            if (!success) return BadRequest(new { message = "Không thể cập nhật hồ sơ." });
            return Ok(new { message = "Cập nhật hồ sơ thành công." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [AllowAnonymous]
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        var otp = await _authService.ForgotPasswordAsync(request);
        if (otp == null)
        {
            return BadRequest(new { message = "Tên đăng nhập hoặc địa chỉ email không đúng." });
        }
        
        // Trong hệ thống thật, bạn không trả về OTP ở đây, mà gửi nó qua Email.
        // Để hiển thị cho người dùng (hoặc demo), ta sẽ gửi kèm OTP trong lời nhắn.
        return Ok(new { 
            message = "Yêu cầu đã được xác nhận. Một email chứa mã OTP đã được gửi.",
            // CHÚ Ý: Bỏ dòng này đi nếu đưa lên môi trường thật!
            otpCode = otp
        });
    }

    [AllowAnonymous]
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        try
        {
            var success = await _authService.ResetPasswordAsync(request);
            if (!success)
            {
                return BadRequest(new { message = "Lỗi xác minh. Hãy thử lại." });
            }
            return Ok(new { message = "Đổi mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
