import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login/login').then((module) => module.Login)
  },
  {
    path: 'error',
    loadComponent: () => import('./shared/components/error').then((module) => module.Error)
  },
  {
    path: '',
    loadComponent: () => import('./core/layout/layout').then((module) => module.Layout),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/portal/portal').then((module) => module.Portal)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
