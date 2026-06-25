using System.Security.Claims;
using Application.Common.Models;
using Domain.Common;
using WebApi.Extension;
using WebApi.Services;

namespace WebApi.Endpoints.Portal;

/// <summary>
/// Maps the portal bootstrap endpoints used by the migrated NewSAD shell.
/// </summary>
public sealed class PortalEndpoints : IEndpoint
{
    /// <inheritdoc />
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        ArgumentNullException.ThrowIfNull(app);

        var group = app.MapGroup("/api/portal")
            .RequireAuthorization()
            .WithTags("Portal");

        group.MapGet("/bootstrap", GetBootstrap);
    }

    private static IResult GetBootstrap(HttpContext httpContext, SessionPrincipalFactory sessionPrincipalFactory, PortalConfiguration portalConfiguration)
    {
        ArgumentNullException.ThrowIfNull(httpContext);
        ArgumentNullException.ThrowIfNull(sessionPrincipalFactory);
        ArgumentNullException.ThrowIfNull(portalConfiguration);

        var response = new ApiResponse<PortalBootstrapDto>
        {
            Success = true,
            Message = "The portal bootstrap payload was loaded successfully.",
            Data = new PortalBootstrapDto(
                BuildSessionUser(httpContext.User, sessionPrincipalFactory),
                portalConfiguration.NavigationLinks
                    .Select(static link => new NavigationLinkDto(link.Label, link.Icon, link.Url))
                    .ToArray(),
                portalConfiguration.Reports
                    .Select(static report => new ReportItemDto(report.Key, report.Label, report.EmbedUrl))
                    .ToArray(),
                new ThemeConfigDto(
                    portalConfiguration.Theme.DefaultMode,
                    portalConfiguration.Theme.StorageKey))
        };

        return Results.Ok(response);
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
}
