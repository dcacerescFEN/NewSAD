import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthStore } from '../../features/auth/services/auth-store';
import { PortalStore } from '../stores/portal-store';

const AUTH_STATUS_HEADER_NAME = 'X-Auth-Status';
const SESSION_VALIDATION_FAILED_STATUS = 'session-validation-failed';
const UNAUTHENTICATED_STATUS = 'unauthenticated';
const SESSION_INFO_URL = '/api/auth/user-info';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authStore = inject(AuthStore);
  const portalStore = inject(PortalStore);
  const router = inject(Router);
  const updatedRequest = request.clone({
    setHeaders: {
      'X-Requested-With': 'XMLHttpRequest',
    },
  });

  return next(updatedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      const authStatus = error.headers.get(AUTH_STATUS_HEADER_NAME);
      const returnUrl = resolveReturnUrl(router);

      if (authStatus === SESSION_VALIDATION_FAILED_STATUS) {
        portalStore.clear();
        authStore.setSessionFailure(resolveAuthErrorMessage(error));
        void router.navigate(['/error'], {
          queryParams: {
            reason: 'auth-session',
            returnUrl,
          },
        });
      } else if (error.status === 401 && authStatus === UNAUTHENTICATED_STATUS) {
        portalStore.clear();

        if (isSessionInfoRequest(updatedRequest.url)) {
          authStore.clearSession();
        } else {
          authStore.recoverUnauthenticatedRequest(returnUrl);
        }
      }

      return throwError(() => error);
    }),
  );
};

function isSessionInfoRequest(requestUrl: string): boolean {
  return requestUrl.includes(SESSION_INFO_URL);
}

function resolveReturnUrl(router: Router): string {
  const browserUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (!router.url || (router.url === '/' && browserUrl !== '/')) {
    return browserUrl;
  }

  return router.url;
}

function resolveAuthErrorMessage(error: HttpErrorResponse): string {
  const apiError = error.error as { message?: string } | null;
  return apiError?.message ?? 'Authentication is temporarily unavailable. Please try again later.';
}
