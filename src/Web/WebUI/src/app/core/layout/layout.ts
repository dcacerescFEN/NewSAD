import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './components/header';
import { Footer } from './components/footer';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, Header, Footer],
  template: `
  <div>
    <app-header/>

    <main class="layout-content container-fluid" >
        <div>
          <router-outlet/>
        </div>
        <app-footer/>
      </main>
  </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: `
    .layout-shell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: var(--layout-background);
    }

    app-header {
      position: sticky;
      top: 0;
      z-index: 101;
      display: block;
    }

    .layout-body {
      display: flex;
      flex: 1 1 auto;
      min-height: 0;
      position: relative;
      margin-top: 60px;
    }

    .layout-content {
      flex: 1 1 auto;
      min-width: 0;
      min-height: calc(100dvh - 60px);
      display: flex;
      flex-direction: column;
      gap: 0;
      padding: 1rem 2rem 0;
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

    .layout-content--detail {
      margin-left: 280px;
      transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .layout-shell--detail-collapsed .layout-content--detail {
      margin-left: 76px;
    }

    .layout-sidebar-backdrop {
      position: fixed;
      top: 56px;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.3);
      backdrop-filter: blur(4px);
      z-index: 98;
    }

    @media (max-width: 991.98px) {
      .layout-content,
      .layout-content--detail,
      .layout-shell--detail-collapsed .layout-content--detail {
        margin-left: 0;
        padding-left: 1rem;
        padding-right: 1rem;
      }

      app-footer {
        margin-left: -1rem;
        margin-right: -1rem;
      }
    }

    @media (max-width: 767.98px) {
      .layout-content,
      .layout-content--detail,
      .layout-shell--detail-collapsed .layout-content--detail {
        padding-left: 0.75rem;
        padding-right: 0.75rem;
      }

      app-footer {
        margin-left: -0.75rem;
        margin-right: -0.75rem;
      }
    }
  `,
})
export class Layout {

}
