namespace Domain.Constants;

/// <summary>
/// Aplicación del estándar de nombres de <c>Estandarizacion-Permisos.md</c>: cada módulo declara
/// sus roles administrativos como ROLE_&lt;MÓDULO&gt;_ADMIN y ROLE_&lt;MÓDULO&gt;_SUPERADMIN.
/// </summary>
public abstract class Roles
{
    // El valor viaja sin el prefijo ROLE_ que agrega Keycloak, igual que en los demás módulos del
    // ecosistema. El acceso completo del rol se limita a este módulo: no alcanza a los demás.
    public const string SuperAdmin = "SAD_SUPERADMIN";
    public const string Administrator = "SAD_ADMIN";
}
