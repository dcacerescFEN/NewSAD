import { describe, expect, it, vi } from 'vitest';
import Keycloak from 'keycloak-js';
import { AuthStore } from './auth-store';
import { PERMISSIONS } from '../../../core/permissions';

const requiredPermission = PERMISSIONS.SAD_ACCESS;

function createStore(clientValues: string[], otherClientValues: string[] = []): AuthStore {
  const store = new AuthStore();
  const keycloak = {
    authenticated: true,
    tokenParsed: {
      resource_access: {
        NewSAD: { roles: clientValues },
        'other-client': { roles: otherClientValues },
      },
      preferred_username: 'synthetic-user',
    },
  } as unknown as Keycloak;

  store.setKeycloak(keycloak, 'NewSAD');
  return store;
}

describe('AuthStore global access', () => {
  it.each(['ROLE_SAD_ADMIN', 'ROLE_SAD_SUPERADMIN'])(
    'allows %s without the required permission',
    (role) => {
      const store = createStore([role]);

      expect(store.hasGlobalAccess()).toBe(true);
      expect(store.hasPermission(requiredPermission)).toBe(true);
    },
  );

  it('denies a normal user with an ordinary permission from global access', () => {
    const store = createStore(['PERMISSION_SAD_ACCESS']);

    expect(store.hasGlobalAccess()).toBe(false);
    expect(store.hasPermission(requiredPermission)).toBe(true);
  });

  it.each(['ROLE_ADMIN', 'ROLE_SUPERADMIN'])(
    'does not treat the legacy %s role as module global access',
    (role) => {
      const store = createStore([role]);

      expect(store.hasGlobalAccess()).toBe(false);
      expect(store.hasPermission(requiredPermission)).toBe(false);
    },
  );

  it('does not accept the legacy Spanish permission identifier', () => {
    const store = createStore(['PERMISSION_SAD_INGRESAR']);

    // La normalización solo quita el prefijo PERMISSION_; la autorización exige el valor exacto.
    expect(store.permissions()).toEqual(['SAD_INGRESAR']);
    expect(store.hasPermission(requiredPermission)).toBe(false);
  });

  it.each([
    ['ROLE_SAD_SUPERADMIN', true],
    ['ROLE_SAD_ADMIN', false],
    ['ROLE_SUPERADMIN', false],
  ])('reports isSuperAdmin for %s as %s', (role, expected) => {
    expect(createStore([role]).isSuperAdmin()).toBe(expected);
  });

  it('uses only the configured client access values for roles and permissions', () => {
    const store = createStore(
      ['PERMISSION_SAD_ACCESS'],
      ['ROLE_SAD_SUPERADMIN', 'PERMISSION_OTRA_APP'],
    );

    expect(store.username()).toBe('synthetic-user');
    expect(store.hasGlobalAccess()).toBe(false);
    expect(store.hasPermission(requiredPermission)).toBe(true);
  });

  it('normalizes Keycloak-prefixed values to internal names', () => {
    const store = createStore(['ROLE_SAD_ADMIN', 'PERMISSION_SAD_ACCESS']);

    expect(store.permissions()).toEqual([requiredPermission]);
    expect(store.hasGlobalAccess()).toBe(true);
  });

  it('keeps the authenticated Keycloak username available during impersonation', () => {
    const store = createStore(['ROLE_SAD_ADMIN']);
    store.setImpersonation({ userName: 'impersonated-user', roles: [], permissions: [] });

    expect(store.authenticatedUsername()).toBe('synthetic-user');
    expect(store.username()).toBe('impersonated-user');
  });

  it('clears the local token without invoking Keycloak logout when token renewal fails', async () => {
    const store = new AuthStore();
    const clearToken = vi.fn();
    const logout = vi.fn();
    const keycloak = {
      authenticated: true,
      clearToken,
      logout,
      updateToken: vi.fn().mockRejectedValue(new Error('Token refresh failed')),
    } as unknown as Keycloak;
    store.setKeycloak(keycloak, 'NewSAD');

    await expect(store.getValidToken()).resolves.toBeNull();

    expect(clearToken).toHaveBeenCalledOnce();
    expect(logout).not.toHaveBeenCalled();
  });
});
