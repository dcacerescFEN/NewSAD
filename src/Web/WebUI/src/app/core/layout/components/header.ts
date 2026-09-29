import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import {NgbCollapseModule, NgbDropdown, NgbDropdownItem, NgbDropdownMenu, NgbDropdownToggle, NgbTooltip} from '@ng-bootstrap/ng-bootstrap'
import { AuthStore } from '../../../features/auth/services/auth-store';
import { Impersonation } from '../../../features/admin/services/impersonation';
import { ThemePreference, ThemeStore } from '../../stores/theme-store';
import { ConfigStore } from '../../stores/config-store';
import { MenuDestinations } from '../../models/site-config';

const moduleLinks: { key: keyof MenuDestinations; label: string; icon: string }[] = [
  { key: 'alumnos', label: 'Alumnos', icon: 'bi-person-badge' },
  { key: 'profesores', label: 'Profesores', icon: 'bi-person-lines-fill' },
  { key: 'cursos', label: 'Cursos', icon: 'bi-book' },
  { key: 'examenes', label: 'Exámenes', icon: 'bi-clipboard-check' },
  { key: 'actividades', label: 'Actividades', icon: 'bi-calendar-event' },
  { key: 'ayudantes', label: 'Ayudantes', icon: 'bi-people' },
  { key: 'procesos', label: 'Procesos', icon: 'bi-gear' },
  { key: 'administracion', label: 'Administración', icon: 'bi-shield-lock' },
];


@Component({
  selector: 'app-header',
  imports: [RouterLink, NgbTooltip, NgbDropdown, NgbDropdownToggle, NgbDropdownMenu, NgbDropdownItem, NgbCollapseModule],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark shadow-sm nav-header">
    <div class="container-fluid">
     

      <a class="navbar-brand" routerLink="/">
         <img src="/logo-fen-white-letters.svg" height="28" alt="logo" class="mx-auto" >
      </a>

      <button class="navbar-toggler" type="button" aria-label="Alternar navegación" [attr.aria-expanded]="!isMenuCollapsed" (click)="toggleMenu()">
          <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" [ngbCollapse]="isMenuCollapsed">
        <ul class="navbar-nav me-auto">
             @for (item of moduleLinks; track item.key) {
             @if (item.key !== 'administracion' || (authStore.hasGlobalAccess() && !authStore.isImpersonating())) {
               <li class="nav-item">
                 @if (configStore.config().menu[item.key]; as destination) {
                   <a class="nav-link header-nav-link" [href]="destination" (click)="closeMenu()">
                     <i class="bi" [class]="item.icon"></i><span>{{ item.label }}</span>
                   </a>
                 } @else {
                   <span class="nav-link header-nav-link" aria-disabled="true" [attr.aria-label]="item.label + ' no disponible'" title="No disponible">
                     <i class="bi" [class]="item.icon"></i><span>{{ item.label }}</span>
                   </span>
                 }
               </li>
             }
             }
        </ul>
  
        <div class="header-actions d-flex align-items-center">
          <div ngbDropdown class="me-3">
              <button class="header-icon-btn dropdown-toggle" type="button" id="themeMenu" ngbDropdownToggle aria-label="Cambiar tema">
                <i class="bi fs-5" [class]="themeIconClass()"></i>
              </button>
              <div class="dropdown-menu dropdown-menu-end" ngbDropdownMenu aria-labelledby="themeMenu">
                <button ngbDropdownItem type="button" (click)="setTheme('light')">
                  <i class="bi bi-sun-fill me-2"></i> Claro
                  @if (themeStore.preference() === 'light') {
                    <i class="bi bi-check2 ms-auto"></i>
                  }
                </button>
                <button ngbDropdownItem type="button" (click)="setTheme('dark')">
                  <i class="bi bi-moon-stars-fill me-2"></i> Oscuro
                  @if (themeStore.preference() === 'dark') {
                    <i class="bi bi-check2 ms-auto"></i>
                  }
                </button>
                <button ngbDropdownItem type="button" (click)="setTheme('auto')">
                  <i class="bi bi-circle-half me-2"></i> Auto
                  @if (themeStore.preference() === 'auto') {
                    <i class="bi bi-check2 ms-auto"></i>
                  }
                </button>
              </div>
          </div>

            <a href="http://g.fen.uchile.cl" target="_blank"  ngbTooltip="Correo FEN" class="text-white me-3">
                <i class="bi bi-envelope fs-5"></i>
            </a>
            <div ngbDropdown class="me-3">
              <button class="header-icon-btn dropdown-toggle" type="button" id="userMenu" ngbDropdownToggle aria-label="Menú usuario">
                <i class="bi bi-person-circle fs-5"></i>
              </button>
              <div class="dropdown-menu dropdown-menu-end" ngbDropdownMenu aria-labelledby="userMenu">
                <a ngbDropdownItem href="https://cuenta.fen.uchile.cl" target="_blank">
                  <i class="bi bi-key-fill"></i> Cambiar Contraseña
                </a>
                <button ngbDropdownItem (click)="logout()">
                    <i class="bi bi-box-arrow-right"></i> Cerrar Sesión
                </button>
                @if (authStore.isImpersonating()) {
                  <button ngbDropdownItem (click)="stopImpersonation()">
                    <i class="bi bi-person-dash"></i> Dejar suplantación
                  </button>
                }
              </div>
            </div>
        </div>
      </div>
    </div>

  </nav>

  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: `

  .nav-header {
    display: flex;
    align-items: center;
    min-height: 56px;
    background: linear-gradient(135deg, var(--primary-blue-deep) 0%, var(--primary-blue) 58%, #1d4f9a 100%);
    padding: 0.5rem 1rem;
    gap: 0.5rem;
    flex-shrink: 0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .header-actions {
    gap: 0.25rem;
  }

  .header-icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border: none;
    border-radius: 999px;
    background: transparent;
    color: #fff;
    transition: background-color 0.15s ease;
    cursor: pointer;

    &::after {
      display: none !important;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.12);
    }
  }

.header-toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  cursor: pointer;
  transition: background-color 0.15s ease;
  flex-shrink: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.22);
  }
}

.header-nav-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
  transition: background-color 0.15s ease, color 0.15s ease;

  i {
    font-size: 0.9rem;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
  }

  &.active {
    background: rgba(255, 255, 255, 0.18);
    color: #fff;
    font-weight: 600;
  }

  &[aria-disabled="true"] {
    opacity: 0.55;
    cursor: not-allowed;
  }

  &[aria-disabled="true"]:hover {
    background: transparent;
    color: rgba(255, 255, 255, 0.8);
  }
}

// Ocultar labels de nav en pantallas pequeñas, mantener solo iconos
@media (max-width: 991.98px) {
  .nav-header {
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
    height: auto;
  }

  .navbar-collapse {
    width: 100%;
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid rgba(255, 255, 255, 0.16);
  }

  .header-actions {
    justify-content: flex-end;
    padding-top: 0.75rem;
  }

  .header-nav-link span {
    display: none;
  }
}

@media (max-width: 575.98px) {
  .navbar-nav {
    gap: 0.25rem;
  }

  .header-nav-link {
    width: 100%;
    justify-content: flex-start;
  }

  .header-nav-link span {
    display: inline;
  }
}
  `,
})
export class Header {

  protected readonly authStore = inject(AuthStore);
  protected readonly configStore = inject(ConfigStore);
  protected readonly moduleLinks = moduleLinks;
  private readonly impersonation = inject(Impersonation);
  private router = inject(Router);
  readonly themeStore = inject(ThemeStore);
  readonly themeIconClass = computed(() => {
    if (this.themeStore.preference() === 'auto') {
      return 'bi bi-circle-half';
    }

    return this.themeStore.resolvedTheme() === 'dark' ? 'bi bi-moon-stars-fill' : 'bi bi-sun-fill';
  });

  isMenuCollapsed = true;

  toggleMenu(): void {
    this.isMenuCollapsed = !this.isMenuCollapsed;
  }

  closeMenu(): void {
    this.isMenuCollapsed = true;
  }

  setTheme(theme: ThemePreference): void {
    this.themeStore.setPreference(theme);
  }

  logout():void{
    this.authStore.logout();
  }

  stopImpersonation(): void {
    void this.impersonation.stop().then(() => this.router.navigateByUrl('/students'));
  }



}
