import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  AuthStore,
  SESSION_LOAD_RESULT,
} from '../../services/auth-store';

const LOGIN_ERROR_MESSAGES = {
  maintenance: 'NewSAD is unavailable during maintenance.',
  'access-denied': 'Access to NewSAD was denied by the identity provider. Please try again.',
  'callback-failed': 'We could not complete the sign-in callback. Please try again.',
  'authentication-failed': 'We could not complete sign-in. Please try again.',
  'remote-failure': 'Sign-in is temporarily unavailable. Please try again.',
} as const;

@Component({
  selector: 'app-login',
  imports: [RouterLink],
  template: `
    <main class="container py-5">
      <div class="row justify-content-center">
        <div class="col-lg-6">
          <div class="card border-0 shadow-sm">
            <div class="card-body p-4 p-md-5">
              <p class="text-uppercase text-muted mb-2">NewSAD</p>
              <h1 class="h3 mb-3">Sign-in gateway</h1>
              <p class="text-muted mb-4">
                Protected routes use the backend cookie session. Continue to start or recover sign-in.
              </p>

              @if (authStore.error()) {
                <div class="alert alert-danger" role="alert">{{ authStore.error() }}</div>
              }

              <div class="d-flex flex-column flex-sm-row gap-2">
                <button type="button" class="btn btn-primary" (click)="signIn()">Start sign-in</button>
                <a routerLink="/" class="btn btn-outline-secondary">Back home</a>
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
export class Login {
  protected readonly authStore = inject(AuthStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly returnUrl = computed(() => this.route.snapshot.queryParamMap.get('returnUrl') ?? '/');

  constructor() {
    const errorCode = this.route.snapshot.queryParamMap.get('error');

    if (errorCode && errorCode in LOGIN_ERROR_MESSAGES) {
      this.authStore.error.set(LOGIN_ERROR_MESSAGES[errorCode as keyof typeof LOGIN_ERROR_MESSAGES]);
      return;
    }

    if (this.authStore.isAuthenticated()) {
      void this.router.navigateByUrl(this.returnUrl());
      return;
    }

    if (this.authStore.authState() === SESSION_LOAD_RESULT.FAILED) {
      this.authStore.error.set(
        this.authStore.error() ?? 'Authentication is temporarily unavailable. Please retry sign-in.',
      );
      return;
    }

    void this.resumeSessionOrStartLogin();
  }

  protected signIn(): void {
    this.authStore.startLogin(this.returnUrl());
  }

  private async resumeSessionOrStartLogin(): Promise<void> {
    const sessionResult = await this.authStore.loadSession();

    if (sessionResult === SESSION_LOAD_RESULT.AUTHENTICATED) {
      await this.router.navigateByUrl(this.returnUrl());
      return;
    }

    if (sessionResult === SESSION_LOAD_RESULT.FAILED) {
      this.authStore.error.set(
        this.authStore.error() ?? 'Authentication is temporarily unavailable. Please retry sign-in.',
      );
      return;
    }

    this.authStore.startLogin(this.returnUrl());
  }
}
