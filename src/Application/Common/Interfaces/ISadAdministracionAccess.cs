using Application.Common.Models;

namespace Application.Common.Interfaces;

/// <summary>
/// Defines the seam used to read NewSAD authorization data from the shared SADAdministracion database.
/// </summary>
public interface ISadAdministracionAccess
{
    /// <summary>
    /// Resolves the current local authorization snapshot for the specified user.
    /// </summary>
    /// <param name="userName">The local user name to search for.</param>
    /// <param name="cancellationToken">The cancellation token for the async operation.</param>
    /// <returns>The resolved authorization data, or <see langword="null"/> when the user does not exist.</returns>
    Task<SadAdministracionUserAccess?> FindUserAccessAsync(string userName, CancellationToken cancellationToken);
}
