using Application.Common.Interfaces;
using Application.Common.Models;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

internal sealed class SadAdministracionAccess(SADAdministracionContext context) : ISadAdministracionAccess
{
    private readonly SADAdministracionContext _context = context;

    public async Task<SadAdministracionUserAccess?> FindUserAccessAsync(string userName, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(userName);

        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserName == userName, cancellationToken);

        if (user is null)
        {
            return null;
        }

        var roleAssignments = await _context.UserRoles
            .AsNoTracking()
            .Where(x => x.UserId == user.UserId && x.Role.IsActive)
            .Select(x => new { x.RoleId, x.Role.RoleName })
            .ToListAsync(cancellationToken);

        var roleIds = roleAssignments.Select(x => x.RoleId).Distinct().ToArray();
        var roles = roleAssignments.Select(x => x.RoleName).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();

        var permissions = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        if (roleIds.Length > 0)
        {
            var rolePermissions = await _context.RolePermissions
                .AsNoTracking()
                .Where(x => roleIds.Contains(x.RoleId) && x.Permission.IsActive)
                .Select(x => x.Permission.PermissionSlug)
                .ToListAsync(cancellationToken);

            permissions.UnionWith(rolePermissions);
        }

        var userPermissions = await _context.UserPermissions
            .AsNoTracking()
            .Where(x => x.UserId == user.UserId && x.Permission.IsActive)
            .Select(x => x.Permission.PermissionSlug)
            .ToListAsync(cancellationToken);

        permissions.UnionWith(userPermissions);

        return new SadAdministracionUserAccess(
            user.UserName,
            user.FirstName,
            user.LastName,
            user.IsActive,
            roles,
            permissions.ToArray());
    }
}
