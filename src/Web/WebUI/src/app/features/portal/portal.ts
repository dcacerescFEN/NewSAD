import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PortalStore } from '../../core/stores/portal-store';
import { Reports } from '../reports/reports';

@Component({
  selector: 'app-portal',
  imports: [Reports],
  template: `
    @if (portalStore.bootstrap(); as bootstrap) {
      <section class="portal-page py-4 py-lg-5">
        <div class="card border-0 shadow-sm portal-page__summary">
          <div class="card-body p-4 p-xl-5">
            <p class="text-uppercase text-muted mb-2">Authenticated portal</p>
            <div class="d-flex flex-column flex-lg-row justify-content-between gap-3 align-items-lg-start">
              <div>
                <h1 class="h3 mb-3">Welcome back, {{ bootstrap.user.displayName }}</h1>
                <p class="text-muted mb-0">
                  The migrated NewSAD shell now consumes the protected portal bootstrap and
                  keeps both Power BI views available inside the Angular experience.
                </p>
              </div>

              <dl class="portal-page__metrics mb-0">
                <div>
                  <dt>Signed-in user</dt>
                  <dd>{{ bootstrap.user.userName }}</dd>
                </div>
                <div>
                  <dt>Reports</dt>
                  <dd>{{ bootstrap.reports.length }}</dd>
                </div>
                <div>
                  <dt>External links</dt>
                  <dd>{{ bootstrap.navigationLinks.length }}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <app-reports class="d-block mt-4" [reports]="bootstrap.reports" />
      </section>
    }
  `,
  styles: `
    .portal-page__summary {
      background:
        linear-gradient(
          135deg,
          color-mix(in srgb, var(--layout-surface-strong) 92%, var(--primary-blue) 8%),
          color-mix(in srgb, var(--layout-surface-strong) 82%, var(--layout-background) 18%)
        );
    }

    .portal-page__metrics {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 1rem;
      min-width: min(100%, 22rem);
    }

    .portal-page__metrics div {
      padding: 0.85rem 1rem;
      border: 1px solid var(--layout-border-color);
      border-radius: 0.9rem;
      background: color-mix(in srgb, var(--layout-surface-strong) 88%, transparent 12%);
    }

    .portal-page__metrics dt {
      margin-bottom: 0.25rem;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--layout-muted-text);
    }

    .portal-page__metrics dd {
      margin: 0;
      font-size: 1rem;
      font-weight: 700;
      color: var(--layout-text);
    }

    @media (max-width: 991.98px) {
      .portal-page__metrics {
        grid-template-columns: 1fr;
        min-width: 0;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Portal {
  protected readonly portalStore = inject(PortalStore);
}
