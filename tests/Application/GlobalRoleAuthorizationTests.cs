using System.Security.Claims;
using Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;
using WebApi.Authentication;
using WebApi.Services;

namespace Application;

public class GlobalRoleAuthorizationTests
{
    [Theory]
    [InlineData("ROLE_SUPERADMIN")]
    [InlineData("ROLE_ADMIN")]
    public async Task GlobalClientRoleGrantsEntryWithoutPermission(string clientRole)
    {
        var principal = CreatePrincipal(clientRole);

        Assert.False(principal.HasClaim(KeycloakClaimsMapper.PermissionsClaimType, Permission.SAD_Enter));
        Assert.True(KeycloakClaimsMapper.HasPermissionOrGlobalAccess(principal, Permission.SAD_Enter));
        Assert.True(await IsAuthorizedAsync(principal));
    }

    [Fact]
    public async Task OrdinaryClientPermissionGrantsEntry()
    {
        var principal = CreatePrincipal("ROLE_USER", "PERMISSION_SAD_INGRESAR");

        Assert.True(KeycloakClaimsMapper.HasPermissionOrGlobalAccess(principal, Permission.SAD_Enter));
        Assert.True(await IsAuthorizedAsync(principal));
    }

    [Theory]
    [InlineData("ROLE_USER")]
    [InlineData("ROLE_Administrador")]
    [InlineData("ROLE_SuperAdmin")]
    public async Task ClientRoleWithoutPermissionDoesNotGrantEntry(string clientRole)
    {
        var principal = CreatePrincipal(clientRole);

        Assert.False(KeycloakClaimsMapper.HasPermissionOrGlobalAccess(principal, Permission.SAD_Enter));
        Assert.False(await IsAuthorizedAsync(principal));
    }

    private static ClaimsPrincipal CreatePrincipal(params string[] clientRoles)
    {
        var roles = string.Join(",", clientRoles.Select(role => $"\"{role}\""));
        var identity = new ClaimsIdentity(
            [new Claim("resource_access", $"{{\"newsad\":{{\"roles\":[{roles}]}}}}")],
            "Keycloak");
        KeycloakClaimsMapper.Map(identity, "newsad");
        return new ClaimsPrincipal(identity);
    }

    private static async Task<bool> IsAuthorizedAsync(ClaimsPrincipal principal)
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddAuthorization();
        services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
        using var provider = services.BuildServiceProvider();
        var authorization = provider.GetRequiredService<IAuthorizationService>();
        return (await authorization.AuthorizeAsync(principal, Permission.SAD_Enter)).Succeeded;
    }
}
