using System.Security.Claims;
using Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using WebApi;
using WebApi.Authentication;

namespace Application;

public class ImpersonationAuthorizationTests
{
    [Fact]
    public void SuperAdminCanStartImpersonation()
    {
        Assert.True(KeycloakClaimsMapper.CanStartImpersonation(CreatePrincipal("ROLE_SAD_SUPERADMIN")));
    }

    [Fact]
    public void ModuleAdminCannotStartImpersonation()
    {
        var principal = CreatePrincipal("ROLE_SAD_ADMIN");

        Assert.True(KeycloakClaimsMapper.HasGlobalAccess(principal));
        Assert.False(KeycloakClaimsMapper.CanStartImpersonation(principal));
    }

    [Theory]
    [InlineData("ROLE_ADMIN")]
    [InlineData("ROLE_SUPERADMIN")]
    [InlineData("ROLE_USER")]
    public void RoleOutsideTheModuleScopeCannotStartImpersonation(string clientRole)
    {
        Assert.False(KeycloakClaimsMapper.CanStartImpersonation(CreatePrincipal(clientRole)));
    }

    [Fact]
    public void AnActiveImpersonationCannotStartAnotherOne()
    {
        var identity = new ClaimsIdentity(CreatePrincipal("ROLE_SAD_SUPERADMIN").Claims, "Keycloak");
        identity.AddClaim(new Claim(KeycloakClaimsMapper.IsImpersonatedClaimType, "true"));

        Assert.False(KeycloakClaimsMapper.CanStartImpersonation(new ClaimsPrincipal(identity)));
    }

    [Fact]
    public async Task ImpersonationPolicyAllowsOnlyTheModuleSuperAdminRole()
    {
        Assert.True(await IsPolicySatisfiedAsync(CreatePrincipal("ROLE_SAD_SUPERADMIN")));
    }

    [Theory]
    [InlineData("ROLE_SAD_ADMIN")]
    [InlineData("ROLE_ADMIN")]
    [InlineData("ROLE_SUPERADMIN")]
    [InlineData("ROLE_USER")]
    public async Task ImpersonationPolicyDeniesEveryOtherRole(string clientRole)
    {
        Assert.False(await IsPolicySatisfiedAsync(CreatePrincipal(clientRole)));
    }

    [Fact]
    public async Task ImpersonationPolicyDeniesAnAnonymousCaller()
    {
        Assert.False(await IsPolicySatisfiedAsync(new ClaimsPrincipal(new ClaimsIdentity())));
    }

    [Fact]
    public async Task WebApiRegistersAndRequiresTheImpersonationPolicyForItsEndpoint()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddWebApiServices(BuildConfiguration());

        using var provider = services.BuildServiceProvider();
        var policyProvider = provider.GetRequiredService<IAuthorizationPolicyProvider>();
        var policy = await policyProvider.GetPolicyAsync(ImpersonationPolicy.Name);

        Assert.NotNull(policy);
        Assert.Contains(policy!.Requirements, requirement =>
            requirement is RolesAuthorizationRequirement roles
            && roles.AllowedRoles!.SequenceEqual([Roles.SuperAdmin]));
    }

    private static async Task<bool> IsPolicySatisfiedAsync(ClaimsPrincipal principal)
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddAuthorization(options => options.AddPolicy(
            ImpersonationPolicy.Name,
            ImpersonationPolicy.Create()));
        services.AddSingleton<IAuthorizationPolicyProvider, WebApi.Services.PermissionPolicyProvider>();
        using var provider = services.BuildServiceProvider();
        var authorization = provider.GetRequiredService<IAuthorizationService>();
        return (await authorization.AuthorizeAsync(principal, ImpersonationPolicy.Name)).Succeeded;
    }

    private static IConfiguration BuildConfiguration() => new ConfigurationBuilder()
        .AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Keycloak:Url"] = "https://sso.example.org",
            ["Keycloak:Realm"] = "Test",
            ["Keycloak:ClientId"] = "Newsad",
        })
        .Build();

    private static ClaimsPrincipal CreatePrincipal(params string[] clientRoles)
    {
        var roles = string.Join(",", clientRoles.Select(role => $"\"{role}\""));
        var identity = new ClaimsIdentity(
            [new Claim("resource_access", $"{{\"newsad\":{{\"roles\":[{roles}]}}}}")],
            "Keycloak");
        KeycloakClaimsMapper.Map(identity, "newsad");
        return new ClaimsPrincipal(identity);
    }
}
