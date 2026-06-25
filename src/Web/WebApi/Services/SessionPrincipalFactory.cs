using System.Globalization;
using System.Security.Claims;
using Application.Auth.Commands.UserLogin;
using Application.Common.Mediator;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;

namespace WebApi.Services;

/// <summary>
/// Creates and revalidates the local session principal used by the NewSAD Web API.
/// </summary>
/// <param name="requestDispatcher">The application request dispatcher.</param>
public sealed class SessionPrincipalFactory(IRequestDispatcher requestDispatcher)
{
    private readonly IRequestDispatcher _requestDispatcher = requestDispatcher ?? throw new ArgumentNullException(nameof(requestDispatcher));

    /// <summary>
    /// The claim type used for local permission values.
    /// </summary>
    public const string PermissionClaimType = "permission";

    /// <summary>
    /// The authentication property key used to store the last local authorization validation timestamp.
    /// </summary>
    public const string LastValidatedAtPropertyKey = "LastValidatedAt";

    /// <summary>
    /// The current request item key used to store a session validation failure.
    /// </summary>
    public const string SessionValidationFailureItemKey = "SessionValidationFailure";

    /// <summary>
    /// The response header used to describe the authentication status for SPA callers.
    /// </summary>
    public const string AuthStatusHeaderName = "X-Auth-Status";

    /// <summary>
    /// The response header used to describe the next authentication action for SPA callers.
    /// </summary>
    public const string AuthActionHeaderName = "X-Auth-Action";

    /// <summary>
    /// The action value indicating that the client can start the login flow.
    /// </summary>
    public const string LoginAction = "login";

    /// <summary>
    /// The authentication status value returned when no valid application session exists.
    /// </summary>
    public const string UnauthenticatedStatus = "unauthenticated";

    /// <summary>
    /// The authentication status value returned when the local session could not be revalidated.
    /// </summary>
    public const string SessionValidationFailedStatus = "session-validation-failed";

    /// <summary>
    /// The default message returned when authentication is required.
    /// </summary>
    public const string AuthenticationRequiredMessage = "Authentication is required.";

    /// <summary>
    /// The interval used to re-check local authorization for an active cookie session.
    /// </summary>
    public static readonly TimeSpan RevalidationInterval = TimeSpan.FromMinutes(5);

    /// <summary>
    /// Resolves the canonical local user name from the current identity provider claims.
    /// </summary>
    /// <param name="principal">The authenticated principal to inspect.</param>
    /// <returns>The resolved local user name, or an empty string when one cannot be found.</returns>
    public string ResolveUserName(ClaimsPrincipal? principal)
    {
        var preferredUserName = principal?.FindFirst("preferred_username")?.Value
            ?? principal?.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? principal?.Identity?.Name;

        if (!string.IsNullOrWhiteSpace(preferredUserName))
        {
            return preferredUserName;
        }

        var email = principal?.FindFirst(ClaimTypes.Email)?.Value
            ?? principal?.FindFirst("email")?.Value;

        return string.IsNullOrWhiteSpace(email)
            ? string.Empty
            : email.Split('@')[0];
    }

    /// <summary>
    /// Loads the local authorization snapshot required to create or refresh a NewSAD session.
    /// </summary>
    /// <param name="userName">The local user name to authorize.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The authorized session snapshot.</returns>
    /// <exception cref="InvalidOperationException">Thrown when the user cannot be admitted locally.</exception>
    public async Task<SessionAuthorizationSnapshot> GetRequiredSnapshotAsync(string userName, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(userName))
        {
            throw new InvalidOperationException("The identity provider user name could not be resolved for local authorization.");
        }

        var response = await _requestDispatcher.Send(new UserLogin(userName), cancellationToken).ConfigureAwait(false);

        if (!response.Success)
        {
            throw new InvalidOperationException(response.Message);
        }

        return response.Data;
    }

    /// <summary>
    /// Creates the cookie principal used by the NewSAD application session.
    /// </summary>
    /// <param name="snapshot">The local authorization snapshot to project into claims.</param>
    /// <returns>The generated claims principal.</returns>
    public ClaimsPrincipal CreatePrincipal(SessionAuthorizationSnapshot snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        var identity = new ClaimsIdentity(
            CookieAuthenticationDefaults.AuthenticationScheme,
            ClaimTypes.Name,
            ClaimTypes.Role);

        identity.AddClaim(new Claim(ClaimTypes.Name, snapshot.UserName));
        identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, snapshot.UserName));
        identity.AddClaim(new Claim("preferred_username", snapshot.UserName));

        if (!string.IsNullOrWhiteSpace(snapshot.FirstName))
        {
            identity.AddClaim(new Claim("given_name", snapshot.FirstName));
        }

        if (!string.IsNullOrWhiteSpace(snapshot.LastName))
        {
            identity.AddClaim(new Claim("family_name", snapshot.LastName));
        }

        var displayName = $"{snapshot.FirstName} {snapshot.LastName}".Trim();

        if (!string.IsNullOrWhiteSpace(displayName))
        {
            identity.AddClaim(new Claim("name", displayName));
        }

        foreach (var role in snapshot.Roles.Where(static role => !string.IsNullOrWhiteSpace(role)).Distinct(StringComparer.OrdinalIgnoreCase))
        {
            identity.AddClaim(new Claim(ClaimTypes.Role, role));
        }

        foreach (var permission in snapshot.Permissions.Where(static permission => !string.IsNullOrWhiteSpace(permission)).Distinct(StringComparer.OrdinalIgnoreCase))
        {
            identity.AddClaim(new Claim(PermissionClaimType, permission));
        }

        return new ClaimsPrincipal(identity);
    }

    /// <summary>
    /// Determines whether the current cookie session should be revalidated against the local authorization source.
    /// </summary>
    /// <param name="properties">The authentication properties for the active session.</param>
    /// <param name="clock">The current clock value.</param>
    /// <returns><see langword="true"/> when the current request should trigger local revalidation.</returns>
    public bool ShouldRevalidate(AuthenticationProperties? properties, DateTimeOffset clock)
    {
        if (properties?.Items is null
            || !properties.Items.TryGetValue(LastValidatedAtPropertyKey, out var lastValidatedAt)
            || string.IsNullOrWhiteSpace(lastValidatedAt)
            || !DateTimeOffset.TryParse(lastValidatedAt, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var parsedTimestamp))
        {
            return true;
        }

        return clock - parsedTimestamp > RevalidationInterval;
    }

    /// <summary>
    /// Updates the session revalidation timestamp stored in the authentication properties.
    /// </summary>
    /// <param name="properties">The authentication properties to update.</param>
    /// <param name="clock">The current clock value.</param>
    public void StampRevalidation(AuthenticationProperties properties, DateTimeOffset clock)
    {
        ArgumentNullException.ThrowIfNull(properties);

        properties.Items[LastValidatedAtPropertyKey] = clock.ToString("O", CultureInfo.InvariantCulture);
    }

    /// <summary>
    /// Stores a session validation failure for the current request.
    /// </summary>
    /// <param name="httpContext">The current HTTP context.</param>
    /// <param name="message">The failure message to store.</param>
    public void MarkSessionValidationFailure(HttpContext httpContext, string message)
    {
        ArgumentNullException.ThrowIfNull(httpContext);

        httpContext.Items[SessionValidationFailureItemKey] = new SessionValidationFailure(message);
    }

    /// <summary>
    /// Resolves the current request's session validation failure, when one exists.
    /// </summary>
    /// <param name="httpContext">The current HTTP context.</param>
    /// <returns>The stored failure, or <see langword="null"/> when none exists.</returns>
    public SessionValidationFailure? GetSessionValidationFailure(HttpContext httpContext)
    {
        ArgumentNullException.ThrowIfNull(httpContext);

        return httpContext.Items.TryGetValue(SessionValidationFailureItemKey, out var failure)
            ? failure as SessionValidationFailure
            : null;
    }

    /// <summary>
    /// Writes authentication status headers used by API and SPA callers.
    /// </summary>
    /// <param name="response">The HTTP response to update.</param>
    /// <param name="authStatus">The authentication status value.</param>
    /// <param name="canStartLogin">Indicates whether the client can start the login flow automatically.</param>
    public void SetAuthResponseHeaders(HttpResponse response, string authStatus, bool canStartLogin = false)
    {
        ArgumentNullException.ThrowIfNull(response);

        response.Headers[AuthStatusHeaderName] = authStatus;

        if (canStartLogin)
        {
            response.Headers[AuthActionHeaderName] = LoginAction;
            return;
        }

        response.Headers.Remove(AuthActionHeaderName);
    }

    /// <summary>
    /// Represents a local session validation failure captured during cookie revalidation.
    /// </summary>
    /// <param name="Message">The failure message.</param>
    public sealed record SessionValidationFailure(string Message);
}
