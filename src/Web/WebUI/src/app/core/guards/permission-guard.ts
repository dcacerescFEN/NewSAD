import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStore } from '../../features/auth/services/auth-store';

export const permissionGuard: CanActivateFn = (route) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  const permission = route.data['permission'] as string | undefined;
  const permissions = route.data['permissions'] as string[] | undefined;
  const globalAccessOnly = route.data['globalAccessOnly'] === true;

  if (route.data['keycloakOnly'] && authStore.isImpersonating?.()) {
    return router.parseUrl('/forbidden');
  }

  if (globalAccessOnly) {
    return authStore.hasGlobalAccess()
      ? true
      : router.parseUrl('/forbidden');
  }

  if ((!permission && !permissions?.length)
    || (permission && authStore.hasPermission(permission))
    || permissions?.some(permission => authStore.hasPermission(permission))) {
    return true;
  }

  return router.parseUrl('/forbidden');
};
