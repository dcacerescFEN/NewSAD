import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { ApiResponse } from '../../../core/models/api-response';
import type { UserSession } from '../models/user-session';
import { AuthService } from './auth';

export const SESSION_LOAD_RESULT = {
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
  FAILED: 'failed',
} as const;

export type SessionLoadResult =
  (typeof SESSION_LOAD_RESULT)[keyof typeof SESSION_LOAD_RESULT];

@Injectable({
  providedIn: 'root',
})
export class AuthStore {
  private readonly authService = inject(AuthService);
  private sessionLoadPromise: Promise<SessionLoadResult> | null = null;
  private loginRedirectInProgress = false;

  private readonly currentUser = signal<UserSession | null>(null);
  private readonly sessionState = signal<SessionLoadResult>(SESSION_LOAD_RESULT.UNAUTHENTICATED);

  readonly user = this.currentUser.asReadonly();
  readonly authState = this.sessionState.asReadonly();
  readonly error = signal<string | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly roles = computed(() => this.currentUser()?.roles ?? []);
  readonly permissions = computed(() => this.currentUser()?.permissions ?? []);
  readonly userName = computed(() => this.currentUser()?.userName ?? null);
  readonly displayName = computed(() => this.currentUser()?.displayName ?? this.userName());

  async loadSession(force = false): Promise<SessionLoadResult> {
    if (!force && this.isAuthenticated()) {
      return SESSION_LOAD_RESULT.AUTHENTICATED;
    }

    if (!force && this.sessionLoadPromise) {
      return this.sessionLoadPromise;
    }

    this.sessionLoadPromise = this.loadSessionInternal();

    try {
      return await this.sessionLoadPromise;
    } finally {
      this.sessionLoadPromise = null;
    }
  }

  setUser(user: UserSession): void {
    this.currentUser.set(user);
    this.sessionState.set(SESSION_LOAD_RESULT.AUTHENTICATED);
    this.error.set(null);
    this.loginRedirectInProgress = false;
  }

  clearSession(): void {
    this.currentUser.set(null);
    this.sessionState.set(SESSION_LOAD_RESULT.UNAUTHENTICATED);
    this.error.set(null);
    this.loginRedirectInProgress = false;
  }

  recoverUnauthenticatedRequest(returnUrl: string): void {
    this.clearSession();

    if (this.loginRedirectInProgress || !this.shouldRestartLogin(returnUrl)) {
      return;
    }

    this.loginRedirectInProgress = true;
    this.startLogin(returnUrl);
  }

  setSessionFailure(message: string): void {
    this.currentUser.set(null);
    this.sessionState.set(SESSION_LOAD_RESULT.FAILED);
    this.error.set(message);
    this.loginRedirectInProgress = false;
  }

  startLogin(returnUrl: string): void {
    this.authService.startLogin(returnUrl);
  }

  logout(): void {
    this.clearSession();
    this.authService.logout();
  }

  private async loadSessionInternal(): Promise<SessionLoadResult> {
    try {
      const response = await firstValueFrom(this.authService.checkSession());
      return this.applySessionResponse(response);
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        this.clearSession();
        return SESSION_LOAD_RESULT.UNAUTHENTICATED;
      }

      this.setSessionFailure(resolveErrorMessage(error));
      return SESSION_LOAD_RESULT.FAILED;
    }
  }

  private applySessionResponse(response: ApiResponse<UserSession>): SessionLoadResult {
    if (!response.success || !response.data) {
      this.setSessionFailure(response.message || 'The current session could not be validated.');
      return SESSION_LOAD_RESULT.FAILED;
    }

    this.setUser(response.data);
    return SESSION_LOAD_RESULT.AUTHENTICATED;
  }

  private shouldRestartLogin(returnUrl: string): boolean {
    return !['/login', '/error'].some((route) => returnUrl.startsWith(route));
  }
}

function resolveErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const apiError = error.error as Partial<ApiResponse<unknown>> | null;

    if (apiError?.message) {
      return apiError.message;
    }
  }

  return 'The current session could not be validated.';
}
