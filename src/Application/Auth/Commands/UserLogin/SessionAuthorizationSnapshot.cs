namespace Application.Auth.Commands.UserLogin;

/// <summary>
/// Represents the local authorization snapshot required to create a NewSAD session.
/// </summary>
/// <param name="UserName">The local user name admitted to the session.</param>
/// <param name="FirstName">The local first name associated with the user.</param>
/// <param name="LastName">The local last name associated with the user.</param>
/// <param name="Roles">The local roles assigned to the user.</param>
/// <param name="Permissions">The local permissions assigned to the user.</param>
/// <param name="IsAdministrator">Indicates whether the user has an administrative role.</param>
/// <param name="CanImpersonate">Indicates whether the user can impersonate another user.</param>
public sealed record SessionAuthorizationSnapshot(
    string UserName,
    string? FirstName,
    string? LastName,
    IReadOnlyCollection<string> Roles,
    IReadOnlyCollection<string> Permissions,
    bool IsAdministrator,
    bool CanImpersonate);
