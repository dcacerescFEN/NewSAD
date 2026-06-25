import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { APP_INITIALIZER, ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { authInterceptor } from './core/interceptors/auth-interceptor';
import { initializeAuthSession } from './core/initializers/auth-session';
import { AuthStore } from './features/auth/services/auth-store';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuthSession,
      deps: [AuthStore, Router],
      multi: true,
    },
  ]
};
