import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
import type { ReportItem } from '../../../core/models/portal-bootstrap';

const REPORT_VIEW_STATE = {
  IDLE: 'idle',
  LOADING: 'loading',
  LOADED: 'loaded',
  UNAVAILABLE: 'unavailable',
} as const;

type ReportViewState = (typeof REPORT_VIEW_STATE)[keyof typeof REPORT_VIEW_STATE];

const LOAD_TIMEOUT_MS = 15000;

@Component({
  selector: 'app-report-frame',
  imports: [],
  template: `
    <section class="report-frame" [attr.aria-busy]="isLoading()">
      @if (safeEmbedUrl()) {
        <iframe
          class="report-frame__iframe"
          [src]="safeEmbedUrl()"
          [title]="report().label"
          loading="lazy"
          referrerpolicy="strict-origin-when-cross-origin"
          (load)="handleLoad()"
          (error)="handleError()"></iframe>
      }

      @if (isLoading()) {
        <div class="report-frame__overlay">
          <span class="spinner-border text-primary" role="status" aria-hidden="true"></span>
          <p class="mb-0">Loading the Power BI view...</p>
        </div>
      }

      @if (isUnavailable()) {
        <div class="report-frame__overlay report-frame__overlay--error">
          <i class="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>
          <div>
            <h3 class="h5 mb-2">This Power BI view is unavailable.</h3>
            <p class="mb-3">{{ errorMessage() }}</p>
            <button type="button" class="btn btn-outline-danger btn-sm" (click)="retry()">
              <i class="bi bi-arrow-clockwise me-1"></i>
              Retry report
            </button>
          </div>
        </div>
      }
    </section>
  `,
  styles: `
    .report-frame {
      position: relative;
      min-height: min(72vh, 860px);
      overflow: hidden;
      border: 1px solid var(--layout-border-color);
      border-radius: 1rem;
      background:
        linear-gradient(
          180deg,
          color-mix(in srgb, var(--layout-surface-strong) 94%, #ffffff 6%),
          color-mix(in srgb, var(--layout-surface) 76%, var(--layout-background) 24%)
        );
    }

    .report-frame__iframe {
      display: block;
      width: 100%;
      min-height: min(72vh, 860px);
      border: 0;
      background: #fff;
    }

    .report-frame__overlay {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      gap: 0.75rem;
      padding: 2rem;
      text-align: center;
      background: color-mix(in srgb, var(--layout-surface-strong) 90%, transparent 10%);
      color: var(--layout-muted-text);
    }

    .report-frame__overlay--error {
      color: var(--bs-danger-text-emphasis);
    }

    .report-frame__overlay--error i {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportFrame {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);
  private loadTimeoutId: ReturnType<typeof window.setTimeout> | null = null;

  readonly report = input.required<ReportItem>();
  readonly active = input(false);

  private readonly reloadVersion = signal(0);
  private readonly currentState = signal<ReportViewState>(REPORT_VIEW_STATE.IDLE);
  private readonly currentError = signal<string | null>(null);
  private readonly activateEffect = effect(() => {
    const active = this.active();
    const report = this.report();
    const reloadVersion = this.reloadVersion();

    if (!active) {
      this.clearLoadTimeout();
      return;
    }

    if (!report.embedUrl) {
      this.markUnavailable('The report address is not available in the protected bootstrap payload.');
      return;
    }

    if (this.currentState() === REPORT_VIEW_STATE.LOADED) {
      return;
    }

    this.beginLoad(reloadVersion);
  });

  protected readonly errorMessage = this.currentError.asReadonly();
  protected readonly isLoading = computed(() => this.currentState() === REPORT_VIEW_STATE.LOADING);
  protected readonly isUnavailable = computed(
    () => this.currentState() === REPORT_VIEW_STATE.UNAVAILABLE,
  );
  protected readonly safeEmbedUrl = computed<SafeResourceUrl | null>(() => {
    const report = this.report();

    if (!this.active() || !report.embedUrl || this.isUnavailable()) {
      return null;
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(
      appendRetryQuery(report.embedUrl, this.reloadVersion()),
    );
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.clearLoadTimeout());
  }

  protected retry(): void {
    this.currentState.set(REPORT_VIEW_STATE.IDLE);
    this.currentError.set(null);
    this.reloadVersion.update((value) => value + 1);
  }

  protected handleLoad(): void {
    if (!this.isLoading()) {
      return;
    }

    this.clearLoadTimeout();
    this.currentState.set(REPORT_VIEW_STATE.LOADED);
    this.currentError.set(null);
  }

  protected handleError(): void {
    this.markUnavailable('The report could not be loaded right now. Please try again.');
  }

  private beginLoad(reloadVersion: number): void {
    void reloadVersion;
    this.clearLoadTimeout();
    this.currentState.set(REPORT_VIEW_STATE.LOADING);
    this.currentError.set(null);
    this.loadTimeoutId = window.setTimeout(() => {
      this.markUnavailable('The report did not respond in time. Please retry the view.');
    }, LOAD_TIMEOUT_MS);
  }

  private markUnavailable(message: string): void {
    this.clearLoadTimeout();
    this.currentState.set(REPORT_VIEW_STATE.UNAVAILABLE);
    this.currentError.set(message);
  }

  private clearLoadTimeout(): void {
    if (this.loadTimeoutId === null) {
      return;
    }

    window.clearTimeout(this.loadTimeoutId);
    this.loadTimeoutId = null;
  }
}

function appendRetryQuery(embedUrl: string, retryVersion: number): string {
  const separator = embedUrl.includes('?') ? '&' : '?';
  return `${embedUrl}${separator}newsadRetry=${retryVersion}`;
}
