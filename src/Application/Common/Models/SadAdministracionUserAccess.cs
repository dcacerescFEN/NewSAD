namespace Application.Common.Models;

/// <summary>
/// Represents the local authorization data required to bootstrap a NewSAD session.
/// </summary>
public sealed record SadAdministracionUserAccess(
    string UserName,
    string? FirstName,
    string? LastName,
    bool IsActive,
    IReadOnlyCollection<string> Roles,
    IReadOnlyCollection<string> Permissions);
