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

const sites = [
  ['NewSAD', 'SAD', 'SAD_ACCESS'],
  ['SADAlumnos', 'STUDENT', 'STUDENT_ACCESS_STUDENT_MODULE'],
  ['SADInformes', 'REPORT', 'REPORT_ACCESS'],
  ['SADAdministracion', 'ADMINISTRATION', 'ADMINISTRATION_ACCESS'],
  ['SADProfesores', 'TEACHER', undefined],
  ['SADCursos', 'COURSE', undefined],
  ['SADExamenes', 'EXAM', undefined],
  ['SADActividades', 'ACTIVITY', undefined],
  ['SADAyudantes', 'ASSISTANT', undefined],
  ['SADProcesos', 'PROCESS', undefined],
] as const;

function destinationStore(resourceAccess: unknown, authenticated = true): AuthStore {
  const store = new AuthStore();
  store.setKeycloak({
    authenticated,
    tokenParsed: { resource_access: resourceAccess },
  } as unknown as Keycloak, 'NewSAD');
  return store;
}

describe('AuthStore destination access', () => {
  for (const [client, module, permission] of sites) {
    for (const suffix of ['', '-iis']) {
      const target = client + suffix;
      it.each(['ADMIN', 'SUPERADMIN'])('accepts %s of ' + target, role => {
        const store = destinationStore({ [target]: { roles: [`ROLE_${module}_${role}`] } });
        expect(store.hasSiteAccess(target)).toBe(true);
        expect(store.hasSiteAccess(target + '-desconocido')).toBe(false);
      });
      if (permission) {
        it('accepts only entry permission of ' + target, () => {
          expect(destinationStore({ [target]: { roles: ['PERMISSION_' + permission] } })
            .hasSiteAccess(target)).toBe(true);
        });
      }
      it('denies ' + target + ' from sibling physical client alone', () => {
        const other = suffix ? client : client + '-iis';
        expect(destinationStore({ [other]: { roles: [`ROLE_${module}_SUPERADMIN`] } })
          .hasSiteAccess(target)).toBe(false);
      });
    }
  }

  it.each([
    ['SADInformes', 'REPORT_ACCESS'],
    ['SADInformes', 'ROLE_ADMIN'],
    ['SADInformes', 'PERMISSION_REPORT_VIEW'],
    ['SADAdministracion', 'ROLE_NEWSAD_ADMIN'],
    ['SADProcesos', 'PERMISSION_PROCESS_ACCESS'],
  ])('rejects unsupported %s / %s', (target, role) => {
    expect(destinationStore({ [target]: { roles: [role] } }).hasSiteAccess(target)).toBe(false);
  });

  it.each([undefined, null, [], {}, 'bad', { SADInformes: null },
    { SADInformes: { roles: 'PERMISSION_REPORT_ACCESS' } }])(
    'denies missing or malformed access: %j', access => {
      expect(destinationStore(access).hasSiteAccess('SADInformes')).toBe(false);
    });

  it.each(['__proto__', 'constructor', 'toString', 'SADInformes-iis-iis', ' SADInformes', 'SADInformes '])(
    'denies non-policy or ambiguous client key %j', key => {
      expect(destinationStore({ SADInformes: { roles: ['PERMISSION_REPORT_ACCESS'] } })
        .hasSiteAccess(key)).toBe(false);
    });

  it('denies array resource_access and non-string role entries', () => {
    expect(destinationStore([{ roles: ['PERMISSION_REPORT_ACCESS'] }]).hasSiteAccess('SADInformes'))
      .toBe(false);
    expect(destinationStore({ SADInformes: { roles: [1] } }).hasSiteAccess('SADInformes'))
      .toBe(false);
  });

  it('REPORT access never crosses between SADInformes and SADInformes-iis', () => {
    for (const [granted, queried] of [
      ['SADInformes', 'SADInformes-iis'],
      ['SADInformes-iis', 'SADInformes'],
    ]) {
      const store = destinationStore({ [granted]: { roles: ['PERMISSION_REPORT_ACCESS', 'ROLE_REPORT_ADMIN'] } });
      expect(store.hasSiteAccess(granted)).toBe(true);
      expect(store.hasSiteAccess(queried)).toBe(false);
    }
  });

  it('requires authenticated session and known client', () => {    expect(new AuthStore().hasSiteAccess('SADInformes')).toBe(false);
    expect(destinationStore({ SADInformes: { roles: ['PERMISSION_REPORT_ACCESS'] } }, false)
      .hasSiteAccess('SADInformes')).toBe(false);
    expect(destinationStore({ desconocido: { roles: ['ROLE_REPORT_SUPERADMIN'] } })
      .hasSiteAccess('desconocido')).toBe(false);
  });

  it('during impersonation only the active physical client is evaluated', () => {
    const store = destinationStore({
      NewSAD: { roles: ['ROLE_SAD_SUPERADMIN'] },
      SADInformes: { roles: ['PERMISSION_REPORT_ACCESS'] },
      SADAdministracion: { roles: ['PERMISSION_ADMINISTRATION_ACCESS'] },
    });
    store.setImpersonation({ userName: 'test', roles: [], permissions: [] });
    expect(store.hasSiteAccess('NewSAD')).toBe(false);
    expect(store.hasSiteAccess('SADInformes')).toBe(false);
    expect(store.hasSiteAccess('SADAdministracion')).toBe(false);
    store.setImpersonation({ userName: 'test', roles: ['SAD_ADMIN'], permissions: [] });
    expect(store.hasSiteAccess('NewSAD')).toBe(true);
    expect(store.hasSiteAccess('NewSAD-iis')).toBe(false);
    expect(store.hasSiteAccess('SADInformes')).toBe(false);
    store.setImpersonation({ userName: 'test', roles: [], permissions: ['SAD_ACCESS'] });
    expect(store.hasSiteAccess('NewSAD')).toBe(true);
    store.stopImpersonation();
    expect(store.hasSiteAccess('SADInformes')).toBe(true);
    expect(store.hasSiteAccess('SADAdministracion')).toBe(true);
  });
});

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
