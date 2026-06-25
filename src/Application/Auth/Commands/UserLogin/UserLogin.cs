using Application.Common.Interfaces;
using Application.Common.Mediator;
using Domain.Common;
using Domain.Constants;

namespace Application.Auth.Commands.UserLogin;

/// <summary>
/// Requests local session admission for a previously authenticated identity.
/// </summary>
/// <param name="UserName">The identity provider user name to validate against the local authorization store.</param>
public sealed record UserLogin(string UserName) : IRequest<ApiResponse<SessionAuthorizationSnapshot>>;

/// <summary>
/// Validates that a previously authenticated identity is active in the local authorization store.
/// </summary>
/// <param name="sadAdministracionAccess">The shared authorization seam used to resolve local user access.</param>
public sealed class UserLoginHandler(ISadAdministracionAccess sadAdministracionAccess) : IRequestHandler<UserLogin, ApiResponse<SessionAuthorizationSnapshot>>
{
    private readonly ISadAdministracionAccess _sadAdministracionAccess = sadAdministracionAccess ?? throw new ArgumentNullException(nameof(sadAdministracionAccess));

    /// <inheritdoc />
    public async Task<ApiResponse<SessionAuthorizationSnapshot>> Handle(UserLogin request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.UserName))
        {
            return Fail("A user name is required to authorize the session.");
        }

        try
        {
            var localUser = await _sadAdministracionAccess
                .FindUserAccessAsync(request.UserName.Trim(), cancellationToken)
                .ConfigureAwait(false);

            if (localUser is null || !localUser.IsActive)
            {
                return Fail("The user does not exist or is inactive in the local authorization store.");
            }

            var roles = localUser.Roles
                .Where(role => !string.IsNullOrWhiteSpace(role))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();

            var permissions = localUser.Permissions
                .Where(permission => !string.IsNullOrWhiteSpace(permission))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();

            var isAdministrator = roles.Any(role =>
                string.Equals(role, Roles.SuperAdmin, StringComparison.OrdinalIgnoreCase)
                || string.Equals(role, Roles.Administrator, StringComparison.OrdinalIgnoreCase));

            return Success(new SessionAuthorizationSnapshot(
                localUser.UserName,
                localUser.FirstName,
                localUser.LastName,
                roles,
                permissions,
                isAdministrator,
                isAdministrator));
        }
        catch (Exception)
        {
            return Fail("An unexpected error occurred while authorizing the user.");
        }
    }

    private static ApiResponse<SessionAuthorizationSnapshot> Success(SessionAuthorizationSnapshot snapshot)
    {
        return new ApiResponse<SessionAuthorizationSnapshot>
        {
            Success = true,
            Message = "The user is authorized for a NewSAD session.",
            Data = snapshot
        };
    }

    private static ApiResponse<SessionAuthorizationSnapshot> Fail(string message)
    {
        return new ApiResponse<SessionAuthorizationSnapshot>
        {
            Success = false,
            Message = message,
            Data = default!
        };
    }
}
