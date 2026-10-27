using Domain.Constants;
using Microsoft.AspNetCore.Authorization;

namespace WebApi.Authentication;

/// <summary>
/// Authorization policy of the impersonation endpoint. El estándar reserva la suplantación de
/// usuarios al rol SUPERADMIN del módulo: el rol ADMIN tiene acceso completo dentro de su módulo,
/// pero no puede operar bajo la identidad de otro usuario.
/// </summary>
public static class ImpersonationPolicy
{
    /// <summary>Name under which the policy is registered and required by the endpoint.</summary>
    public const string Name = "SadImpersonation";

    /// <summary>Builds the policy: an authenticated caller holding the module SUPERADMIN role.</summary>
    public static AuthorizationPolicy Create() => new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .RequireRole(Roles.SuperAdmin)
        .Build();
}
