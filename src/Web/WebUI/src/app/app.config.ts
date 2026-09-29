import { ApplicationConfig, inject, LOCALE_ID, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import {
  provideHttpClient,
  withInterceptors,
  withInterceptorsFromDi,
  withXhr,
} from '@angular/common/http';

import { initializeKeycloak } from './core/initializers/keycloak-init';
import { AuthStore } from './features/auth/services/auth-store';
import { authInterceptor } from './core/interceptors/auth-interceptor';
import { errorInterceptor } from './core/interceptors/error-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'es' },
    provideBrowserGlobalErrorListeners(),
    provideAppInitializer(() => initializeKeycloak(inject(AuthStore))()),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withXhr(),
      withInterceptorsFromDi(),
      withInterceptors([authInterceptor, errorInterceptor]),
    ),
  ],
};
