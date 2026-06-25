namespace Infrastructure.Data;

internal sealed class SadAdministracionUser
{
    public Guid UserId { get; set; }
    public string UserName { get; set; } = null!;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public bool IsActive { get; set; }
}

internal sealed class SadAdministracionRole
{
    public Guid RoleId { get; set; }
    public string RoleName { get; set; } = null!;
    public bool IsActive { get; set; }
}

internal sealed class SadAdministracionPermission
{
    public Guid PermissionId { get; set; }
    public string PermissionSlug { get; set; } = null!;
    public bool IsActive { get; set; }
}

internal sealed class SadAdministracionUserRole
{
    public Guid UserId { get; set; }
    public SadAdministracionUser User { get; set; } = null!;
    public Guid RoleId { get; set; }
    public SadAdministracionRole Role { get; set; } = null!;
}

internal sealed class SadAdministracionRolePermission
{
    public Guid RoleId { get; set; }
    public SadAdministracionRole Role { get; set; } = null!;
    public Guid PermissionId { get; set; }
    public SadAdministracionPermission Permission { get; set; } = null!;
}

internal sealed class SadAdministracionUserPermission
{
    public Guid UserId { get; set; }
    public SadAdministracionUser User { get; set; } = null!;
    public Guid PermissionId { get; set; }
    public SadAdministracionPermission Permission { get; set; } = null!;
}
