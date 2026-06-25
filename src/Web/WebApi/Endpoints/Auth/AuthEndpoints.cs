using System.Security.Claims;
using Application.Common.Models;
using Domain.Common;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Mvc;
using WebApi.Extension;
using WebApi.Services;

namespace WebApi.Endpoints.Auth;

/// <summary>
/// Maps the authentication endpoints used by the migrated NewSAD shell.
/// </summary>
public sealed class AuthEndpoints : IEndpoint
{
    /// <inheritdoc />
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        ArgumentNullException.ThrowIfNull(app);

        var group = app.MapGroup("/api/auth")
            .WithTags("Auth");

        group.MapGet("/login", Login)
            .AllowAnonymous();

        group.MapPost("/logout", Logout)
            .AllowAnonymous();

        group.MapGet("/user-info", GetUserInfo)
            .AllowAnonymous();
    }

    private static IResult Login([FromQuery] string? returnUrl)
    {
        return Results.Challenge(
            new AuthenticationProperties
            {
                RedirectUri = NormalizeReturnUrl(returnUrl)
            },
            [OpenIdConnectDefaults.AuthenticationScheme]);
    }

    private static async Task<IResult> Logout(HttpContext httpContext)
    {
        ArgumentNullException.ThrowIfNull(httpContext);

        var authenticationResult = await httpContext
            .AuthenticateAsync(CookieAuthenticationDefaults.AuthenticationScheme)
            .ConfigureAwait(false);

        var authenticationProperties = authenticationResult.Properties ?? new AuthenticationProperties();
        authenticationProperties.RedirectUri = "/api/auth/login?returnUrl=/";

        await httpContext
            .SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme)
            .ConfigureAwait(false);

        if (!authenticationResult.Succeeded)
        {
            return Results.Redirect("/api/auth/login?returnUrl=/");
        }

        return Results.SignOut(authenticationProperties, [OpenIdConnectDefaults.AuthenticationScheme]);
    }

    private static IResult GetUserInfo(HttpContext httpContext, SessionPrincipalFactory sessionPrincipalFactory)
    {
        ArgumentNullException.ThrowIfNull(httpContext);
        ArgumentNullException.ThrowIfNull(sessionPrincipalFactory);

        if (httpContext.User.Identity is null || !httpContext.User.Identity.IsAuthenticated)
        {
            var sessionValidationFailure = sessionPrincipalFactory.GetSessionValidationFailure(httpContext);

            if (sessionValidationFailure is not null)
            {
                sessionPrincipalFactory.SetAuthResponseHeaders(
                    httpContext.Response,
                    SessionPrincipalFactory.SessionValidationFailedStatus);

                return Results.Json(new ApiResponse
                {
                    Success = false,
                    Message = sessionValidationFailure.Message
                }, statusCode: StatusCodes.Status503ServiceUnavailable);
            }

            sessionPrincipalFactory.SetAuthResponseHeaders(
                httpContext.Response,
                SessionPrincipalFactory.UnauthenticatedStatus,
                canStartLogin: true);

            return Results.Json(new ApiResponse
            {
                Success = false,
                Message = SessionPrincipalFactory.AuthenticationRequiredMessage
            }, statusCode: StatusCodes.Status401Unauthorized);
        }

        return Results.Ok(new ApiResponse<SessionUserDto>
        {
            Success = true,
            Message = "The user session is active.",
            Data = BuildSessionUser(httpContext.User, sessionPrincipalFactory)
        });
    }

    private static SessionUserDto BuildSessionUser(ClaimsPrincipal principal, SessionPrincipalFactory sessionPrincipalFactory)
    {
        ArgumentNullException.ThrowIfNull(principal);
        ArgumentNullException.ThrowIfNull(sessionPrincipalFactory);

        var userName = sessionPrincipalFactory.ResolveUserName(principal);
        var givenName = principal.FindFirst("given_name")?.Value;
        var familyName = principal.FindFirst("family_name")?.Value;
        var displayName = $"{givenName} {familyName}".Trim();

        if (string.IsNullOrWhiteSpace(displayName))
        {
            displayName = principal.FindFirst("name")?.Value
                ?? principal.FindFirstValue(ClaimTypes.Name)
                ?? userName;
        }

        var roles = principal.FindAll(ClaimTypes.Role)
            .Select(static claim => claim.Value)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        var permissions = principal.FindAll(SessionPrincipalFactory.PermissionClaimType)
            .Select(static claim => claim.Value)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        return new SessionUserDto(userName, displayName, roles, permissions);
    }

    private static string NormalizeReturnUrl(string? returnUrl)
    {
        return IsSafeLocalReturnUrl(returnUrl)
            ? returnUrl!
            : "/";
    }

    private static bool IsSafeLocalReturnUrl(string? returnUrl)
    {
        if (string.IsNullOrWhiteSpace(returnUrl)
            || !returnUrl.StartsWith('/')
            || returnUrl.StartsWith("//", StringComparison.Ordinal)
            || returnUrl.StartsWith(@"/\", StringComparison.Ordinal))
        {
            return false;
        }

        return Uri.TryCreate(returnUrl, UriKind.Relative, out _);
    }
}
