import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { AuthStore } from '../../features/auth/services/auth-store';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  if (!req.url.startsWith('/api/')) return next(req);

  return from(authStore.getValidToken()).pipe(
    switchMap((token) =>
      next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req),
    ),
  );
};
