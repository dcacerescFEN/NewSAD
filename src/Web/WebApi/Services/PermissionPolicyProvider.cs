using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;
using WebApi.Authentication;

namespace WebApi.Services;

/// <summary>Builds authorization policies for Keycloak permission names on demand.</summary>
public sealed class PermissionPolicyProvider(IOptions<AuthorizationOptions> options)
    : DefaultAuthorizationPolicyProvider(options)
{
    public override async Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
    {
        var policy = await base.GetPolicyAsync(policyName);
        if (policy is not null || !policyName.StartsWith("SAD_", StringComparison.Ordinal))
            return policy;

        return new AuthorizationPolicyBuilder()
            .RequireAuthenticatedUser()
            .RequireAssertion(context =>
                KeycloakClaimsMapper.HasPermissionOrGlobalAccess(context.User, policyName))
            .Build();
    }
}
