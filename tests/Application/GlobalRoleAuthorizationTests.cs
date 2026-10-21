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
    [InlineData("ROLE_SAD_SUPERADMIN")]
    [InlineData("ROLE_SAD_ADMIN")]
    public async Task ModuleGlobalClientRoleGrantsEntryWithoutPermission(string clientRole)
    {
        var principal = CreatePrincipal(clientRole);

        Assert.False(principal.HasClaim(KeycloakClaimsMapper.PermissionsClaimType, Permission.SAD_Access));
        Assert.True(KeycloakClaimsMapper.HasPermissionOrGlobalAccess(principal, Permission.SAD_Access));
        Assert.True(await IsAuthorizedAsync(principal));
    }

    [Fact]
    public async Task OrdinaryClientPermissionGrantsEntry()
    {
        var principal = CreatePrincipal("ROLE_USER", "PERMISSION_SAD_ACCESS");

        Assert.True(KeycloakClaimsMapper.HasPermissionOrGlobalAccess(principal, Permission.SAD_Access));
        Assert.True(await IsAuthorizedAsync(principal));
    }

    [Theory]
    [InlineData("ROLE_USER")]
    [InlineData("ROLE_Administrador")]
    [InlineData("ROLE_SuperAdmin")]
    [InlineData("ROLE_ADMIN")]
    [InlineData("ROLE_SUPERADMIN")]
    public async Task ClientRoleWithoutModulePermissionDoesNotGrantEntry(string clientRole)
    {
        var principal = CreatePrincipal(clientRole);

        Assert.False(KeycloakClaimsMapper.HasPermissionOrGlobalAccess(principal, Permission.SAD_Access));
        Assert.False(await IsAuthorizedAsync(principal));
    }

    [Fact]
    public async Task LegacySpanishPermissionDoesNotGrantEntry()
    {
        var principal = CreatePrincipal("ROLE_USER", "PERMISSION_SAD_INGRESAR");

        Assert.False(principal.HasClaim(KeycloakClaimsMapper.PermissionsClaimType, Permission.SAD_Access));
        Assert.False(KeycloakClaimsMapper.HasPermissionOrGlobalAccess(principal, Permission.SAD_Access));
        Assert.False(await IsAuthorizedAsync(principal));
    }

    [Fact]
    public void GlobalAccessComesOnlyFromTheModuleRolesOfTheStandard()
    {
        Assert.True(KeycloakClaimsMapper.HasGlobalAccess(CreatePrincipal("ROLE_SAD_ADMIN")));
        Assert.True(KeycloakClaimsMapper.HasGlobalAccess(CreatePrincipal("ROLE_SAD_SUPERADMIN")));
        Assert.False(KeycloakClaimsMapper.HasGlobalAccess(CreatePrincipal("ROLE_ADMIN")));
        Assert.False(KeycloakClaimsMapper.HasGlobalAccess(CreatePrincipal("ROLE_SUPERADMIN")));
    }

    [Fact]
    public void IdentifiersMatchTheKeycloakNamesOfTheStandard()
    {
        Assert.Equal("SAD_ADMIN", Roles.Administrator);
        Assert.Equal("SAD_SUPERADMIN", Roles.SuperAdmin);
        Assert.Equal("SAD_ACCESS", Permission.SAD_Access);
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
        return (await authorization.AuthorizeAsync(principal, Permission.SAD_Access)).Succeeded;
    }
}
