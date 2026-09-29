using System.Security.Claims;
using System.Text.Json;
using Application.Common.Interfaces;
using Domain.Constants;

namespace WebApi.Authentication;

/// <summary>Normalizes SADAlumnos client roles and permission claims from a Keycloak access token.</summary>
public static class KeycloakClaimsMapper
{
    public const string PermissionsClaimType = "permissions";
    public const string IsImpersonatedClaimType = "impersonated";
    public const string ActorUserNameClaimType = "actor_username";
    public const string ActorUserIdClaimType = "actor_user_id";
    public const string RolePrefix = "ROLE_";
    public const string PermissionPrefix = "PERMISSION_";
    public static bool HasGlobalAccess(ClaimsPrincipal user) =>
        user.IsInRole(Roles.Administrator) || user.IsInRole(Roles.SuperAdmin);

    public static bool HasPermissionOrGlobalAccess(ClaimsPrincipal user, string permission) =>
        HasGlobalAccess(user) || user.HasClaim(PermissionsClaimType, permission);

    /// <summary>Determines whether the current effective principal can initiate an impersonation.</summary>
    public static bool CanStartImpersonation(ClaimsPrincipal user) =>
        !user.HasClaim(IsImpersonatedClaimType, "true") && HasGlobalAccess(user);

    public static void Map(ClaimsIdentity identity, string clientId)
    {
        AddClientAccess(identity, GetClientAccess(identity, clientId));
    }

    /// <summary>Normalizes only SADAlumnos role and permission naming contracts.</summary>
    public static ImpersonationTarget NormalizeTarget(string userId, string userName, IEnumerable<string> clientRoles)
    {
        var access = GetClientAccess(clientRoles);
        return new ImpersonationTarget(userId, userName, access.Roles, access.Permissions);
    }

    /// <summary>Replaces application authorization claims while preserving the actor as audit metadata.</summary>
    public static void ApplyImpersonation(ClaimsIdentity identity, ImpersonationTarget target)
    {
        var actorUserName = identity.FindFirst("preferred_username")?.Value;
        var actorUserId = identity.FindFirst("sub")?.Value ?? identity.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        foreach (var claim in identity.Claims
                     .Where(claim => claim.Type is ClaimTypes.Role or PermissionsClaimType or "preferred_username" or IsImpersonatedClaimType or ActorUserNameClaimType or ActorUserIdClaimType)
                     .ToArray())
            identity.RemoveClaim(claim);

        identity.AddClaim(new Claim("preferred_username", target.UserName));
        identity.AddClaim(new Claim(IsImpersonatedClaimType, "true"));
        if (!string.IsNullOrWhiteSpace(actorUserName)) identity.AddClaim(new Claim(ActorUserNameClaimType, actorUserName));
        if (!string.IsNullOrWhiteSpace(actorUserId)) identity.AddClaim(new Claim(ActorUserIdClaimType, actorUserId));
        AddClientAccess(identity, new ClientAccess(target.Roles, target.Permissions));
    }

    private static ClientAccess GetClientAccess(ClaimsIdentity identity, string clientId) =>
        GetClientAccess(GetClientAccessValues(identity, clientId));

    private static ClientAccess GetClientAccess(IEnumerable<string> values) => new(
        values.Where(value => value.StartsWith(RolePrefix, StringComparison.Ordinal))
            .Select(value => Normalize(value, RolePrefix))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray(),
        values.Where(value => value.StartsWith(PermissionPrefix, StringComparison.Ordinal))
            .Select(value => Normalize(value, PermissionPrefix))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray());

    private static void AddClientAccess(ClaimsIdentity identity, ClientAccess access)
    {
        foreach (var role in access.Roles) identity.AddClaim(new Claim(ClaimTypes.Role, role));
        foreach (var permission in access.Permissions) identity.AddClaim(new Claim(PermissionsClaimType, permission));
    }

    private static IEnumerable<string> GetClientAccessValues(ClaimsIdentity identity, string clientId)
    {
        var resourceAccess = identity.FindFirst("resource_access")?.Value;
        if (string.IsNullOrWhiteSpace(resourceAccess))
            return [];

        try
        {
            using var document = JsonDocument.Parse(resourceAccess);
            if (!document.RootElement.TryGetProperty(clientId, out var client)
                || !client.TryGetProperty("roles", out var roles)
                || roles.ValueKind != JsonValueKind.Array)
                return [];

            return roles.EnumerateArray()
                .Where(role => role.ValueKind == JsonValueKind.String)
                .Select(role => role.GetString())
                .Where(role => !string.IsNullOrWhiteSpace(role))
                .Select(role => role!)
                .ToArray();
        }
        catch (JsonException)
        {
            return [];
        }
    }

    private static string Normalize(string value, string prefix) => value[prefix.Length..];

    private sealed record ClientAccess(IReadOnlyCollection<string> Roles, IReadOnlyCollection<string> Permissions);
}
