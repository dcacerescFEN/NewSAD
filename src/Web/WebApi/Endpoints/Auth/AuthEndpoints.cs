using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Application.Common.Interfaces;
using Domain.Constants;
using WebApi.Authentication;
using WebApi.Services;

namespace WebApi.Endpoints.Auth;

public sealed class AuthEndpoints : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/auth/impersonation", StartImpersonation)
            .RequireAuthorization(policy => policy.RequireAuthenticatedUser().RequireRole(Roles.Administrator, Roles.SuperAdmin))
            .WithTags("Authentication");
        app.MapDelete("/api/auth/impersonation", StopImpersonation).RequireAuthorization().WithTags("Authentication");
    }

    [EndpointSummary("Inicia la suplantación de identidad de un usuario")]
    private static async Task<IResult> StartImpersonation(
        ImpersonationRequest request,
        ClaimsPrincipal user,
        IAuthService authService,
        IImpersonationContextStore impersonationContexts,
        HttpRequest httpRequest,
        CancellationToken cancellationToken)
    {
        if (!KeycloakClaimsMapper.CanStartImpersonation(user)) return Results.Forbid();
        if (string.IsNullOrWhiteSpace(request.UserName)) return Results.BadRequest(new { code = "invalid_impersonation_request" });
        if (!TryGetBearerToken(httpRequest, out var bearerToken) || !TryGetExpiry(user, out var expiresAt)) return Results.Forbid();
        try
        {
            var target = await authService.GetImpersonationTargetAsync(request.UserName.Trim(), bearerToken, cancellationToken);
            impersonationContexts.Start(bearerToken, target, expiresAt);
            return Results.Ok(new ImpersonationResponse(target.UserName, target.Roles, target.Permissions));
        }
        catch (ImpersonationException exception)
        {
            return Results.Json(new { code = exception.Code }, statusCode: (int)exception.StatusCode);
        }
    }

    [EndpointSummary("Finaliza la suplantación de identidad del usuario")]
    private static IResult StopImpersonation(IImpersonationContextStore impersonationContexts, HttpRequest httpRequest)
    {
        if (!TryGetBearerToken(httpRequest, out var bearerToken)) return Results.Forbid();
        impersonationContexts.Stop(bearerToken);
        return Results.NoContent();
    }

    private static bool TryGetBearerToken(HttpRequest request, out string bearerToken)
    {
        var authorization = request.Headers.Authorization.ToString();
        if (!authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            bearerToken = string.Empty;
            return false;
        }
        bearerToken = authorization["Bearer ".Length..].Trim();
        return !string.IsNullOrWhiteSpace(bearerToken);
    }

    private static bool TryGetExpiry(ClaimsPrincipal user, out DateTimeOffset expiresAt)
    {
        expiresAt = default;
        return long.TryParse(user.FindFirstValue(JwtRegisteredClaimNames.Exp), out var seconds)
            && (expiresAt = DateTimeOffset.FromUnixTimeSeconds(seconds)) > DateTimeOffset.UtcNow;
    }

    private sealed record ImpersonationRequest(string? UserName);
    private sealed record ImpersonationResponse(string UserName, IReadOnlyCollection<string> Roles, IReadOnlyCollection<string> Permissions);
}
