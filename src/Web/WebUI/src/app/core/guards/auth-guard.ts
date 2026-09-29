import { inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../features/auth/services/auth-store';
import { ConfigStore } from '../stores/config-store';

export const authGuard: CanActivateFn = async (_, state) => {
  const authStore = inject(AuthStore);
  const configStore = inject(ConfigStore);
  const router = inject(Router);

  if (!authStore.isAuthenticated()) {
    void authStore.login(state.url);
    return false;
  }
  if (configStore.hasValidConfig()) return true;

  try {
    await configStore.load();
    return true;
  } catch (error) {
    if (error instanceof HttpErrorResponse && error.status === 403) {
      return router.parseUrl('/forbidden');
    }

    return false;
  }
};
