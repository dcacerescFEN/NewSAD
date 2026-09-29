namespace Application.Common.Interfaces;

public interface IAuthService
{
    /// <summary>Gets the username from the authenticated Keycloak principal.</summary>
    string? UserName { get; }

    /// <summary>Gets the roles materialized from the authenticated Keycloak principal.</summary>
    IReadOnlyCollection<string> Roles { get; }

    /// <summary>Gets the permissions materialized from the authenticated Keycloak principal.</summary>
    IReadOnlyCollection<string> Permissions { get; }

    /// <summary>Gets the authenticated actor used for audit operations.</summary>
    string? AuditUserName { get; }

    /// <summary>Resolves a target user's effective SADAlumnos access through Keycloak Admin REST.</summary>
    /// <param name="userName">The target Keycloak username.</param>
    /// <param name="actorToken">The authenticated actor's Keycloak access token.</param>
    /// <param name="cancellationToken">A token for cancelling the operation.</param>
    /// <returns>The target identity and normalized effective client access.</returns>
    Task<ImpersonationTarget> GetImpersonationTargetAsync(string userName, string actorToken, CancellationToken cancellationToken);
}

/// <summary>Represents the server-authoritative identity and SADAlumnos access of an impersonation target.</summary>
public sealed record ImpersonationTarget(
    string UserId,
    string UserName,
    IReadOnlyCollection<string> Roles,
    IReadOnlyCollection<string> Permissions);
