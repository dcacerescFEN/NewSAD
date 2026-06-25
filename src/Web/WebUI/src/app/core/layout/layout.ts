import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from './components/footer';
import { Header } from './components/header';
import { PortalStore } from '../stores/portal-store';
import { ThemeStore } from '../stores/theme-store';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, Header, Footer],
  template: `
    <div class="layout-shell">
      <app-header />

      <main class="layout-content container-fluid">
        <div class="layout-page-slot">
          <router-outlet />
        </div>

        <app-footer />
      </main>
    </div>
  `,
  styles: `
    .layout-shell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: var(--layout-background);
    }

    app-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 101;
      display: block;
    }

    .layout-content {
      flex: 1 1 auto;
      min-height: calc(100dvh - 56px);
      display: flex;
      flex-direction: column;
      padding: 1rem 2rem 0;
      margin-top: 56px;
    }

    .layout-page-slot {
      flex: 1 0 auto;
      min-height: 0;
    }

    app-footer {
      display: block;
      margin-top: auto;
      padding-top: 1.5rem;
      margin-left: -2rem;
      margin-right: -2rem;
    }

    @media (max-width: 991.98px) {
      .layout-content {
        padding-left: 1rem;
        padding-right: 1rem;
      }

      app-footer {
        margin-left: -1rem;
        margin-right: -1rem;
      }
    }

    @media (max-width: 767.98px) {
      .layout-content {
        padding-left: 0.75rem;
        padding-right: 0.75rem;
      }

      app-footer {
        margin-left: -0.75rem;
        margin-right: -0.75rem;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Layout {
  private readonly portalStore = inject(PortalStore);
  private readonly themeStore = inject(ThemeStore);
  private readonly syncThemeEffect = effect(() => {
    const theme = this.portalStore.bootstrap()?.theme;

    if (!theme) {
      return;
    }

    this.themeStore.applyConfig(theme);
  });
}
