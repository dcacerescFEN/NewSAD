import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import type { ReportItem } from '../../core/models/portal-bootstrap';
import { ReportFrame } from './components/report-frame';

@Component({
  selector: 'app-reports',
  imports: [ReportFrame],
  template: `
    <section class="reports card border-0 shadow-sm overflow-hidden">
      <div class="card-body p-0">
        <header class="reports__header p-4 p-xl-5 pb-3">
          <div>
            <p class="text-uppercase text-muted mb-2">Power BI views</p>
            <h2 class="h4 mb-2">Enrollment dashboards</h2>
            <p class="text-muted mb-0">
              Switch between the protected Power BI views without leaving the authenticated shell.
            </p>
          </div>
        </header>

        @if (hasReports()) {
          <div class="px-4 px-xl-5">
            <div class="reports__tabs" role="tablist" aria-label="NewSAD Power BI views">
              @for (report of reports(); track report.key) {
                <button
                  type="button"
                  class="reports__tab"
                  [class.reports__tab--active]="isSelected(report.key)"
                  [attr.aria-selected]="isSelected(report.key)"
                  [attr.id]="'report-tab-' + report.key"
                  [attr.aria-controls]="'report-panel-' + report.key"
                  (click)="selectReport(report.key)">
                  <span class="reports__tab-icon" aria-hidden="true">
                    <i class="bi" [class.bi-bar-chart-fill]="isSelected(report.key)" [class.bi-bar-chart]="!isSelected(report.key)"></i>
                  </span>
                  <span>{{ report.label }}</span>
                </button>
              }
            </div>
          </div>

          <div class="p-4 p-xl-5 pt-4">
            @for (report of reports(); track report.key) {
              <div
                class="reports__panel"
                [class.d-none]="!isSelected(report.key)"
                role="tabpanel"
                [attr.id]="'report-panel-' + report.key"
                [attr.aria-labelledby]="'report-tab-' + report.key">
                <app-report-frame [report]="report" [active]="isSelected(report.key)" />
              </div>
            }
          </div>
        } @else {
          <div class="p-4 p-xl-5">
            <div class="reports__empty-state">
              <i class="bi bi-exclamation-diamond-fill" aria-hidden="true"></i>
              <div>
                <h3 class="h5 mb-2">No Power BI views are configured.</h3>
                <p class="text-muted mb-0">
                  The protected shell loaded successfully, but no report metadata is currently available.
                </p>
              </div>
            </div>
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    .reports__header {
      background: color-mix(in srgb, var(--layout-surface) 72%, var(--layout-background) 28%);
      border-bottom: 1px solid var(--layout-border-color);
    }

    .reports__tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      padding-bottom: 0.25rem;
    }

    .reports__tab {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      min-height: 2.8rem;
      padding: 0.75rem 1rem;
      border: 1px solid var(--layout-border-color);
      border-radius: 999px;
      background: color-mix(in srgb, var(--layout-surface-strong) 90%, transparent 10%);
      color: var(--layout-text);
      font-weight: 600;
      transition:
        border-color 0.2s ease,
        background-color 0.2s ease,
        color 0.2s ease,
        transform 0.2s ease;
    }

    .reports__tab:hover,
    .reports__tab:focus-visible {
      border-color: color-mix(in srgb, var(--primary-blue) 58%, var(--layout-border-color) 42%);
      transform: translateY(-1px);
    }

    .reports__tab--active {
      background: linear-gradient(
        135deg,
        color-mix(in srgb, var(--primary-blue) 86%, #ffffff 14%),
        color-mix(in srgb, var(--primary-blue-deep) 82%, #000000 18%)
      );
      border-color: transparent;
      color: #fff;
      box-shadow: 0 12px 24px rgba(15, 23, 42, 0.18);
    }

    .reports__tab-icon {
      width: 1.2rem;
      text-align: center;
    }

    .reports__empty-state {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 1rem;
      align-items: start;
      padding: 1.25rem;
      border: 1px dashed var(--layout-border-color);
      border-radius: 1rem;
      background: color-mix(in srgb, var(--layout-surface) 60%, transparent 40%);
      color: var(--layout-text);
    }

    .reports__empty-state i {
      font-size: 1.75rem;
      color: var(--bs-warning-text-emphasis);
    }

    @media (max-width: 767.98px) {
      .reports__tabs {
        flex-direction: column;
      }

      .reports__tab {
        justify-content: center;
      }

      .reports__empty-state {
        grid-template-columns: 1fr;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Reports {
  readonly reports = input.required<ReportItem[]>();

  private readonly currentReportKey = signal<string | null>(null);
  private readonly syncSelectedReportEffect = effect(() => {
    const reportItems = this.reports();
    const currentKey = this.currentReportKey();

    if (reportItems.length === 0) {
      if (currentKey !== null) {
        this.currentReportKey.set(null);
      }

      return;
    }

    if (!currentKey || !reportItems.some((report) => report.key === currentKey)) {
      this.currentReportKey.set(reportItems[0].key);
    }
  });

  protected readonly hasReports = computed(() => this.reports().length > 0);

  protected selectReport(reportKey: string): void {
    this.currentReportKey.set(reportKey);
  }

  protected isSelected(reportKey: string): boolean {
    return this.currentReportKey() === reportKey;
  }
}
