import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot } from '@angular/router';
import Keycloak from 'keycloak-js';
import { afterEach, describe, expect, it } from 'vitest';
import { PERMISSIONS } from '../permissions';
import { AuthStore } from '../../features/auth/services/auth-store';
import { permissionGuard } from './permission-guard';

function configure(clientValues: string[]): AuthStore {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const authStore = TestBed.inject(AuthStore);
  authStore.setKeycloak(
    {
      authenticated: true,
      tokenParsed: { resource_access: { NewSAD: { roles: clientValues } } },
    } as unknown as Keycloak,
    'NewSAD',
  );
  return authStore;
}

function runGuard(data: Record<string, unknown>) {
  const route = new ActivatedRouteSnapshot();
  route.data = data;
  return TestBed.runInInjectionContext(() =>
    permissionGuard(route, {} as RouterStateSnapshot),
  );
}

function expectForbidden(result: ReturnType<typeof runGuard>): void {
  expect(
    TestBed.inject(Router).serializeUrl(result as ReturnType<Router['parseUrl']>),
  ).toBe('/forbidden');
}

const adminPanel = { superAdminOnly: true, keycloakOnly: true };

describe('permissionGuard', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('allows the module superadmin into the impersonation panel', () => {
    configure(['ROLE_SAD_SUPERADMIN']);
    expect(runGuard(adminPanel)).toBe(true);
  });

  it('denies the module admin the impersonation panel', () => {
    const authStore = configure(['ROLE_SAD_ADMIN']);

    expect(authStore.hasGlobalAccess()).toBe(true);
    expect(authStore.isSuperAdmin()).toBe(false);
    expectForbidden(runGuard(adminPanel));
  });

  it('denies the impersonation panel to a legacy superadmin role', () => {
    configure(['ROLE_SUPERADMIN']);
    expectForbidden(runGuard(adminPanel));
  });

  it('denies the impersonation panel during an active impersonation', () => {
    const authStore = configure(['ROLE_SAD_SUPERADMIN']);
    authStore.setImpersonation({ userName: 'target-user', roles: [], permissions: [] });

    expectForbidden(runGuard(adminPanel));
  });

  it('allows the layout only with the module entry permission', () => {
    configure(['PERMISSION_SAD_ACCESS']);
    expect(runGuard({ permission: PERMISSIONS.SAD_ACCESS })).toBe(true);

    TestBed.resetTestingModule();
    configure(['PERMISSION_SAD_INGRESAR']);
    expectForbidden(runGuard({ permission: PERMISSIONS.SAD_ACCESS }));
  });

  it('allows the layout to a module administrator without the entry permission', () => {
    configure(['ROLE_SAD_ADMIN']);
    expect(runGuard({ permission: PERMISSIONS.SAD_ACCESS })).toBe(true);
  });
});
