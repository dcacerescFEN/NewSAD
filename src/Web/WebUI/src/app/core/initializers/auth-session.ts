import { Router } from '@angular/router';
import { AuthStore, SESSION_LOAD_RESULT } from '../../features/auth/services/auth-store';

export function initializeAuthSession(authStore: AuthStore, router: Router) {
  return () => {
    const currentUrl = window.location.pathname;

    if (currentUrl === '/login') {
      return true;
    }

    return authStore.loadSession().then((sessionResult) => {
      if (sessionResult === SESSION_LOAD_RESULT.FAILED && currentUrl !== '/error') {
        return router.navigate(['/error'], {
          queryParams: {
            reason: 'auth-session',
            returnUrl: resolveBrowserUrl(),
          },
        });
      }

      return true;
    });
  };
}

function resolveBrowserUrl(): string {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}
