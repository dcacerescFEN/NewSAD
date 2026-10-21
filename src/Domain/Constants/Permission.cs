namespace Domain.Constants;

/// <summary>
/// Aplicación del estándar de nombres de <c>Estandarizacion-Permisos.md</c>: SAD es el nombre
/// propio del sistema legado y el módulo bajo el que se registran sus identificadores.
/// </summary>
public abstract class Permission
{
    // El valor viaja sin el prefijo PERMISSION_ que agrega Keycloak y cumple el formato
    // PERMISSION_<MÓDULO>_<ACCIÓN_DESCRIPTIVA>: módulo SAD y acción ACCESS (ACCEDER), que habilita
    // el ingreso al sistema sin autorizar por sí sola la consulta o la modificación de datos.
    public const string SAD_Access = "SAD_ACCESS";
}
