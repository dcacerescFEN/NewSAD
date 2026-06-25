using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data;

internal sealed class SADAdministracionContext(DbContextOptions<SADAdministracionContext> options) : DbContext(options)
{
    public DbSet<SadAdministracionUser> Users => Set<SadAdministracionUser>();

    public DbSet<SadAdministracionRole> Roles => Set<SadAdministracionRole>();

    public DbSet<SadAdministracionPermission> Permissions => Set<SadAdministracionPermission>();

    public DbSet<SadAdministracionUserRole> UserRoles => Set<SadAdministracionUserRole>();

    public DbSet<SadAdministracionRolePermission> RolePermissions => Set<SadAdministracionRolePermission>();

    public DbSet<SadAdministracionUserPermission> UserPermissions => Set<SadAdministracionUserPermission>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("ADMIN");

        modelBuilder.Entity<SadAdministracionUser>(entity =>
        {
            entity.ToTable("User");
            entity.HasKey(x => x.UserId);
            entity.Property(x => x.UserName).HasColumnType("varchar(30)");
            entity.Property(x => x.FirstName).HasColumnType("varchar(30)");
            entity.Property(x => x.LastName).HasColumnType("varchar(30)");
        });

        modelBuilder.Entity<SadAdministracionRole>(entity =>
        {
            entity.ToTable("Role");
            entity.HasKey(x => x.RoleId);
            entity.Property(x => x.RoleName).HasColumnType("varchar(30)");
        });

        modelBuilder.Entity<SadAdministracionPermission>(entity =>
        {
            entity.ToTable("Permission");
            entity.HasKey(x => x.PermissionId);
            entity.Property(x => x.PermissionSlug).HasColumnType("varchar(100)");
        });

        modelBuilder.Entity<SadAdministracionUserRole>(entity =>
        {
            entity.ToTable("UserRole");
            entity.HasKey(x => new { x.UserId, x.RoleId });
            entity.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId);
            entity.HasOne(x => x.Role).WithMany().HasForeignKey(x => x.RoleId);
        });

        modelBuilder.Entity<SadAdministracionRolePermission>(entity =>
        {
            entity.ToTable("RolePermission");
            entity.HasKey(x => new { x.RoleId, x.PermissionId });
            entity.HasOne(x => x.Role).WithMany().HasForeignKey(x => x.RoleId);
            entity.HasOne(x => x.Permission).WithMany().HasForeignKey(x => x.PermissionId);
        });

        modelBuilder.Entity<SadAdministracionUserPermission>(entity =>
        {
            entity.ToTable("UserPermission");
            entity.HasKey(x => new { x.UserId, x.PermissionId });
            entity.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId);
            entity.HasOne(x => x.Permission).WithMany().HasForeignKey(x => x.PermissionId);
        });
    }
}
