using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using WebApi.Services;

namespace WebApi.IntegrationTests.TestInfrastructure;

internal sealed class AuthenticatedTestAuthHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string SchemeName = "TestAuth";

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.Name, "ada"),
            new Claim(ClaimTypes.NameIdentifier, "ada"),
            new Claim("preferred_username", "ada"),
            new Claim("given_name", "Ada"),
            new Claim("family_name", "Lovelace"),
            new Claim(ClaimTypes.Role, "Administrator"),
            new Claim(ClaimTypes.Role, "Reporter"),
            new Claim(SessionPrincipalFactory.PermissionClaimType, "reports.view"),
            new Claim(SessionPrincipalFactory.PermissionClaimType, "portal.open")
        };

        var identity = new ClaimsIdentity(claims, SchemeName);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, SchemeName);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
