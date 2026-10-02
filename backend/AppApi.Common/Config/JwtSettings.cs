namespace AppApi.Common.Config;

public class JwtSettings
{
    public string Issuer { get; set; } = "AppApi";
    public string Audience { get; set; } = "AppApi.Clients";
    public string SecretKey { get; set; } = "SuperSecretKeyForDevelopmentPhaseOnlyRequireAtLeast256BitsLong123456";
    public int AccessTokenExpirationMinutes { get; set; } = 120;
    public int RefreshTokenExpirationDays { get; set; } = 7;
}
