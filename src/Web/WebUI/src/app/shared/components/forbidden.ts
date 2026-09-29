import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../features/auth/services/auth-store';

@Component({
  selector: 'app-forbidden',
  imports: [NgOptimizedImage, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="container">
    <div class="row justify-content-center align-items-center min-vh-100">
        <div class="col-md-6">
             <img ngSrc="/forbidden.png" width="640" height="480" priority alt="Acceso denegado" />
        </div>
        <div class="col-md-6 text-center">
             <h1 class="display-1">Acceso no autorizado</h1>
             <p class="lead text-muted">No tenés permisos para acceder a esta página.</p>
             <div class="d-flex justify-content-center gap-3 mt-4">
               <a routerLink="/" class="btn btn-primary">Ir al inicio</a>
               <button type="button" (click)="logout()" class="btn btn-outline-danger">Cerrar sesión / Cambiar usuario</button>
             </div>
        </div>
        
    </div>
  </div>`,
  styles: ``,
})
export class Forbidden {
  private readonly authStore = inject(AuthStore);

  protected logout(): void {
    void this.authStore.logout();
  }
}
