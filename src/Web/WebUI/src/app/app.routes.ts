import { Routes } from '@angular/router';
import { permissionGuard } from './core/guards/permission-guard';
import { PERMISSIONS } from './core/permissions';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
    {
        path: 'forbidden',
        loadComponent: () => import('./shared/components/forbidden').then(m => m.Forbidden),
    },
    {
        path: 'admin',
        loadComponent: () => import('./features/admin/admin').then(m => m.Admin),
        canActivate: [authGuard, permissionGuard],
        data: { globalAccessOnly: true, keycloakOnly: true },
    },
    {
        path: '',
        loadComponent: () => import('./core/layout/layout').then(m => m.Layout),
        canActivate: [authGuard, permissionGuard],
        data: { permission: PERMISSIONS.STUDENTS_ENTER },
        children: [
            {
                path: '',
                redirectTo: '',
                pathMatch: 'full'
            },
            {
                path: '',
                loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent)
            },
        ],
    },
    { path: '**', redirectTo: '' },
];
