import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PortalStore } from '../../core/stores/portal-store';
import { AuthStore } from '../../features/auth/services/auth-store';

@Component({
  selector: 'app-error',
  imports: [RouterLink],
  template: `
    <main class="container py-5">
      <div class="row justify-content-center">
        <div class="col-lg-7">
          <div class="card border-0 shadow-sm">
            <div class="card-body p-4 p-md-5">
              <p class="text-uppercase text-muted mb-2">NewSAD</p>
              <h1 class="h3 mb-3">{{ title() }}</h1>
              <p class="text-muted mb-4">{{ message() }}</p>

              <div class="d-flex flex-column flex-sm-row gap-2">
                @if (isAuthSessionError()) {
                  <a routerLink="/login" [queryParams]="{ returnUrl: returnUrl() }" class="btn btn-primary">
                    Open sign-in recovery
                  </a>
                } @else {
                  <a routerLink="/" class="btn btn-primary">Try protected shell again</a>
                }

                <a routerLink="/" class="btn btn-outline-secondary">Go home</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Error {
  private readonly route = inject(ActivatedRoute);
  private readonly authStore = inject(AuthStore);
  private readonly portalStore = inject(PortalStore);

  private readonly reason = computed(() => this.route.snapshot.queryParamMap.get('reason'));
  protected readonly returnUrl = computed(() => this.route.snapshot.queryParamMap.get('returnUrl') ?? '/');
  protected readonly isAuthSessionError = computed(() => this.reason() === 'auth-session');

  protected readonly title = computed(() => {
    if (this.isAuthSessionError()) {
      return 'We could not validate your session.';
    }

    if (this.reason() === 'portal-bootstrap') {
      return 'We could not load the protected portal bootstrap.';
    }

    return 'Something went wrong.';
  });

  protected readonly message = computed(() => {
    if (this.isAuthSessionError()) {
      return this.authStore.error() ?? 'Authentication is temporarily unavailable. Please try again later.';
    }

    if (this.reason() === 'portal-bootstrap') {
      return this.portalStore.error() ?? 'The portal bootstrap payload could not be loaded.';
    }

    return 'We could not finish loading required application data.';
  });
}
