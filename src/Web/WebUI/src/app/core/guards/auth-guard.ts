import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PortalStore } from '../stores/portal-store';
import { AuthStore, SESSION_LOAD_RESULT } from '../../features/auth/services/auth-store';

export const authGuard: CanActivateFn = async (route, state) => {
  const authStore = inject(AuthStore);
  const portalStore = inject(PortalStore);
  const router = inject(Router);

  if (!authStore.isAuthenticated()) {
    const sessionResult = await authStore.loadSession();

    if (sessionResult === SESSION_LOAD_RESULT.UNAUTHENTICATED) {
      portalStore.clear();
      authStore.startLogin(state.url);
      return false;
    }

    if (sessionResult === SESSION_LOAD_RESULT.FAILED) {
      portalStore.clear();
      return router.createUrlTree(['/error'], {
        queryParams: {
          reason: 'auth-session',
          returnUrl: state.url,
        },
      });
    }
  }

  if (route.data?.['skipBootstrapLoad']) {
    return true;
  }

  if (portalStore.hasBootstrap()) {
    return true;
  }

  try {
    await portalStore.load();
    return true;
  } catch {
    return router.createUrlTree(['/error'], {
      queryParams: {
        reason: 'portal-bootstrap',
        returnUrl: state.url,
      },
    });
  }
};
