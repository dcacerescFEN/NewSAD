import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PortalStore } from '../../stores/portal-store';
import { THEME_MODE, type NavigationLink } from '../../models/portal-bootstrap';
import { ThemeStore, type ThemePreference } from '../../stores/theme-store';
import { AuthStore } from '../../../features/auth/services/auth-store';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark shadow-sm nav-header">
      <div class="container-fluid">
        <a class="navbar-brand" routerLink="/" aria-label="NewSAD home">
          <img src="/logo-fen-white-letters.svg" height="28" alt="logo" />
        </a>

        <button
          class="navbar-toggler"
          type="button"
          aria-label="Toggle navigation"
          [attr.aria-expanded]="!menuCollapsed()"
          (click)="toggleMenu()">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" [class.show]="!menuCollapsed()">
          <ul class="navbar-nav me-auto">
            @for (link of navigationLinks(); track link.url) {
              <li class="nav-item">
                <a
                  class="nav-link header-nav-link"
                  [href]="link.url"
                  target="_blank"
                  rel="noreferrer"
                  (click)="closeMenu()">
                  <i class="bi" [class]="'bi ' + link.icon"></i>
                  <span>{{ link.label }}</span>
                </a>
              </li>
            }
          </ul>

          <div class="header-actions d-flex align-items-center">
            <div class="header-user text-end d-none d-lg-block me-2">
              <div class="header-user-name">{{ authStore.displayName() ?? 'Authenticated user' }}</div>
              <div class="header-user-id">{{ authStore.userName() ?? '' }}</div>
            </div>

            <div class="header-dropdown">
              <button
                class="header-icon-btn"
                type="button"
                aria-label="Change theme"
                [attr.aria-expanded]="themeMenuOpen()"
                (click)="toggleThemeMenu()">
                <i class="bi fs-5" [class]="themeIconClass()"></i>
              </button>

              @if (themeMenuOpen()) {
                <div class="dropdown-menu dropdown-menu-end show header-dropdown-menu">
                  @for (themeOption of themeOptions(); track themeOption.value) {
                    <button
                      class="dropdown-item theme-option"
                      [class.active]="themeStore.preference() === themeOption.value"
                      type="button"
                      [attr.aria-pressed]="themeStore.preference() === themeOption.value"
                      (click)="setTheme(themeOption.value)">
                      <i class="bi me-2" [class]="'bi ' + themeOption.icon"></i>
                      <span>{{ themeOption.label }}</span>

                      @if (themeStore.preference() === themeOption.value) {
                        <i class="bi bi-check2 ms-auto"></i>
                      }
                    </button>
                  }
                </div>
              }
            </div>

            <a
              href="http://g.fen.uchile.cl"
              target="_blank"
              rel="noreferrer"
              title="Correo FEN"
              class="header-icon-link text-white">
              <i class="bi bi-envelope fs-5"></i>
            </a>

            <div class="header-dropdown">
              <button
                class="header-icon-btn"
                type="button"
                aria-label="User menu"
                [attr.aria-expanded]="userMenuOpen()"
                (click)="toggleUserMenu()">
                <i class="bi bi-person-circle fs-5"></i>
              </button>

              @if (userMenuOpen()) {
                <div class="dropdown-menu dropdown-menu-end show header-dropdown-menu">
                  <a
                    class="dropdown-item"
                    href="https://cuenta.fen.uchile.cl"
                    target="_blank"
                    rel="noreferrer"
                    (click)="closeUserMenu()">
                    <i class="bi bi-key-fill me-2"></i>
                    <span>Change password</span>
                  </a>
                  <button class="dropdown-item" type="button" (click)="logout()">
                    <i class="bi bi-box-arrow-right me-2"></i>
                    <span>Sign out</span>
                  </button>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: `
    .nav-header {
      min-height: 56px;
      background: linear-gradient(
        135deg,
        var(--primary-blue-deep) 0%,
        var(--primary-blue) 58%,
        #1d4f9a 100%
      );
      padding: 0 1rem;
      z-index: 1030;
    }

    .header-actions {
      gap: 0.25rem;
    }

    .header-user {
      color: rgba(255, 255, 255, 0.92);
      line-height: 1.1;
    }

    .header-user-name {
      font-size: 0.82rem;
      font-weight: 600;
    }

    .header-user-id {
      font-size: 0.72rem;
      color: rgba(255, 255, 255, 0.72);
    }

    .header-dropdown {
      position: relative;
    }

    .header-dropdown-menu {
      position: absolute;
      top: calc(100% + 0.5rem);
      right: 0;
      min-width: 12rem;
    }

    .header-icon-btn,
    .header-icon-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      border: none;
      border-radius: 999px;
      background: transparent;
      color: #fff;
      text-decoration: none;
    }

    .header-icon-btn:hover,
    .header-icon-link:hover {
      background: rgba(255, 255, 255, 0.12);
    }

    .header-nav-link {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      border-radius: 6px;
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.8rem;
      font-weight: 500;
      white-space: nowrap;
    }

    .header-nav-link i {
      font-size: 0.9rem;
    }

    .header-nav-link:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #fff;
    }

    .theme-option {
      display: flex;
      align-items: center;
    }

    @media (max-width: 991.98px) {
      .nav-header {
        padding-top: 0.5rem;
        padding-bottom: 0.5rem;
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  protected readonly authStore = inject(AuthStore);
  protected readonly themeStore = inject(ThemeStore);
  private readonly portalStore = inject(PortalStore);

  protected readonly menuCollapsed = signal(true);
  protected readonly themeMenuOpen = signal(false);
  protected readonly userMenuOpen = signal(false);
  protected readonly navigationLinks = computed<NavigationLink[]>(
    () => this.portalStore.bootstrap()?.navigationLinks ?? [],
  );
  protected readonly themeOptions = computed(() => [
    { value: THEME_MODE.LIGHT, label: 'Light', icon: 'bi-sun-fill' },
    { value: THEME_MODE.DARK, label: 'Dark', icon: 'bi-moon-stars-fill' },
    { value: THEME_MODE.AUTO, label: 'Auto', icon: 'bi-circle-half' },
  ]);
  protected readonly themeIconClass = computed(() => {
    if (this.themeStore.preference() === THEME_MODE.AUTO) {
      return 'bi bi-circle-half';
    }

    return this.themeStore.resolvedTheme() === THEME_MODE.DARK
      ? 'bi bi-moon-stars-fill'
      : 'bi bi-sun-fill';
  });

  protected toggleMenu(): void {
    this.menuCollapsed.update((value) => !value);
    this.themeMenuOpen.set(false);
    this.userMenuOpen.set(false);
  }

  protected closeMenu(): void {
    this.menuCollapsed.set(true);
  }

  protected toggleThemeMenu(): void {
    this.themeMenuOpen.update((value) => !value);
    this.userMenuOpen.set(false);
  }

  protected toggleUserMenu(): void {
    this.userMenuOpen.update((value) => !value);
    this.themeMenuOpen.set(false);
  }

  protected closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  protected setTheme(theme: ThemePreference): void {
    this.themeStore.setPreference(theme);
    this.themeMenuOpen.set(false);
  }

  protected logout(): void {
    this.userMenuOpen.set(false);
    this.authStore.logout();
  }
}
