using System.Net;
using System.Net.Http.Headers;
using System.Security.Claims;
using Application.Common.Interfaces;
using WebApi.Authentication;

namespace WebApi.Services;

/// <summary>Provides authentication operations backed exclusively by Keycloak.</summary>
public class AuthService(
    IHttpContextAccessor httpContextAccessor,
    IHttpClientFactory httpClientFactory,
    IConfiguration configuration,
    ILogger<AuthService> logger) : IAuthService
{
    private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;

    /// <inheritdoc />
    public string? UserName => _httpContextAccessor.HttpContext?.User?.FindFirstValue("preferred_username");

    /// <inheritdoc />
    public IReadOnlyCollection<string> Roles => GetClaimValues(ClaimTypes.Role);

    /// <inheritdoc />
    public IReadOnlyCollection<string> Permissions => GetClaimValues(KeycloakClaimsMapper.PermissionsClaimType);

    /// <inheritdoc />
    public string? AuditUserName => _httpContextAccessor.HttpContext?.User?.FindFirstValue(KeycloakClaimsMapper.ActorUserNameClaimType) ?? UserName;

    /// <inheritdoc />
    public async Task<ImpersonationTarget> GetImpersonationTargetAsync(string userName, string actorToken, CancellationToken cancellationToken)
    {
        var (baseUrl, realm, clientId) = GetKeycloakSettings();
        var client = httpClientFactory.CreateClient();
        var target = await GetTargetUserAsync(client, baseUrl, realm, userName, actorToken, cancellationToken);
        var clientUuid = await GetClientUuidAsync(client, baseUrl, realm, clientId, actorToken, cancellationToken);
        var roleNames = await GetEffectiveClientRolesAsync(client, baseUrl, realm, target.Id!, clientUuid, actorToken, cancellationToken);
        return KeycloakClaimsMapper.NormalizeTarget(target.Id!, target.UserName!, roleNames);
    }

    private (string BaseUrl, string Realm, string ClientId) GetKeycloakSettings()
    {
        var baseUrl = configuration["Keycloak:Url"]?.TrimEnd('/');
        var realm = configuration["Keycloak:Realm"];
        var clientId = configuration["Keycloak:ClientId"];
        if (string.IsNullOrWhiteSpace(baseUrl) || string.IsNullOrWhiteSpace(realm) || string.IsNullOrWhiteSpace(clientId))
            throw new ImpersonationException("impersonation_not_configured", HttpStatusCode.ServiceUnavailable);
        return (baseUrl, realm, clientId);
    }

    private async Task<KeycloakUser> GetTargetUserAsync(HttpClient client, string baseUrl, string realm, string userName, string actorToken, CancellationToken cancellationToken)
    {
        var users = await SendAsync<List<KeycloakUser>>(client, $"{baseUrl}/admin/realms/{Uri.EscapeDataString(realm)}/users?username={Uri.EscapeDataString($"{userName}@fen.uchile.cl")}&exact=true", actorToken, cancellationToken);
        var target = users.SingleOrDefault(user => string.Equals(user.UserName, $"{userName}@fen.uchile.cl", StringComparison.Ordinal));
        if (target is null || string.IsNullOrWhiteSpace(target.Id))
            throw new ImpersonationException("impersonation_target_not_found", HttpStatusCode.NotFound);
        return target;
    }

    private async Task<string> GetClientUuidAsync(HttpClient client, string baseUrl, string realm, string clientId, string actorToken, CancellationToken cancellationToken)
    {
        var clients = await SendAsync<List<KeycloakClient>>(client, $"{baseUrl}/admin/realms/{Uri.EscapeDataString(realm)}/clients?clientId={Uri.EscapeDataString(clientId)}", actorToken, cancellationToken);
        var configuredClient = clients.SingleOrDefault(value => string.Equals(value.ClientId, clientId, StringComparison.Ordinal));
        if (configuredClient is null || string.IsNullOrWhiteSpace(configuredClient.Id))
            throw new ImpersonationException("impersonation_not_configured", HttpStatusCode.ServiceUnavailable);
        return configuredClient.Id;
    }

    private async Task<IReadOnlyCollection<string>> GetEffectiveClientRolesAsync(HttpClient client, string baseUrl, string realm, string userId, string clientUuid, string actorToken, CancellationToken cancellationToken)
    {
        var roles = await SendAsync<List<KeycloakRole>>(client, $"{baseUrl}/admin/realms/{Uri.EscapeDataString(realm)}/users/{Uri.EscapeDataString(userId)}/role-mappings/clients/{Uri.EscapeDataString(clientUuid)}/composite", actorToken, cancellationToken);
        return roles.Select(role => role.Name).Where(name => !string.IsNullOrWhiteSpace(name)).Select(name => name!).ToArray();
    }

    private async Task<T> SendAsync<T>(HttpClient client, string requestUri, string actorToken, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, requestUri);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", actorToken);
        request.Headers.Accept.ParseAdd("application/json");
        try
        {
            using var response = await client.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var code = response.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden ? "keycloak_user_query_denied" : "keycloak_unavailable";
                var status = code == "keycloak_user_query_denied" ? HttpStatusCode.Forbidden : HttpStatusCode.BadGateway;
                logger.LogWarning("Keycloak Admin REST request failed with HTTP status {StatusCode} and diagnostic {DiagnosticCode}", (int)response.StatusCode, code);
                throw new ImpersonationException(code, status);
            }
            return await response.Content.ReadFromJsonAsync<T>(cancellationToken: cancellationToken)
                ?? throw new ImpersonationException("keycloak_invalid_response", HttpStatusCode.BadGateway);
        }
        catch (HttpRequestException)
        {
            logger.LogWarning("Keycloak Admin REST could not reach the provider");
            throw new ImpersonationException("keycloak_unavailable", HttpStatusCode.BadGateway);
        }
    }

    private string[] GetClaimValues(string claimType) => _httpContextAccessor.HttpContext?.User?.FindAll(claimType)
        .Select(claim => claim.Value).Where(value => !string.IsNullOrWhiteSpace(value))
        .Distinct(StringComparer.OrdinalIgnoreCase).ToArray() ?? [];

    private sealed record KeycloakUser(string? Id, string? UserName);
    private sealed record KeycloakClient(string? Id, string? ClientId);
    private sealed record KeycloakRole(string? Name);
}

/// <summary>Represents a safe diagnostic for an unsuccessful impersonation operation.</summary>
public sealed class ImpersonationException(string code, HttpStatusCode statusCode) : Exception(code)
{
    /// <summary>Gets the stable, non-sensitive diagnostic code.</summary>
    public string Code { get; } = code;
    /// <summary>Gets the HTTP status that SADAlumnos should return.</summary>
    public HttpStatusCode StatusCode { get; } = statusCode;
}
