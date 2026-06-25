import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { PortalBootstrap } from '../models/portal-bootstrap';
import { PortalBootstrapService } from '../services/portal-bootstrap';
import { AuthStore } from '../../features/auth/services/auth-store';

const BOOTSTRAP_LOAD_STATE = {
  IDLE: 'idle',
  LOADING: 'loading',
  LOADED: 'loaded',
  FAILED: 'failed',
} as const;

export type BootstrapLoadState =
  (typeof BOOTSTRAP_LOAD_STATE)[keyof typeof BOOTSTRAP_LOAD_STATE];

@Injectable({
  providedIn: 'root',
})
export class PortalStore {
  private readonly portalBootstrapService = inject(PortalBootstrapService);
  private readonly authStore = inject(AuthStore);
  private loadPromise: Promise<void> | null = null;

  private readonly state = signal<PortalBootstrap | null>(null);
  private readonly bootstrapState = signal<BootstrapLoadState>(BOOTSTRAP_LOAD_STATE.IDLE);
  private readonly bootstrapError = signal<string | null>(null);

  readonly bootstrap = this.state.asReadonly();
  readonly loadState = this.bootstrapState.asReadonly();
  readonly error = this.bootstrapError.asReadonly();

  async load(force = false): Promise<void> {
    if (!force && this.hasBootstrap()) {
      return;
    }

    if (!force && this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.loadInternal();

    try {
      await this.loadPromise;
    } finally {
      this.loadPromise = null;
    }
  }

  hasBootstrap(): boolean {
    return this.state() !== null;
  }

  clear(): void {
    this.state.set(null);
    this.bootstrapState.set(BOOTSTRAP_LOAD_STATE.IDLE);
    this.bootstrapError.set(null);
  }

  private async loadInternal(): Promise<void> {
    this.bootstrapState.set(BOOTSTRAP_LOAD_STATE.LOADING);
    this.bootstrapError.set(null);

    try {
      const response = await firstValueFrom(this.portalBootstrapService.getBootstrap());

      if (!response.success || !response.data) {
        throw new Error(response.message || 'The portal bootstrap payload could not be loaded.');
      }

      this.state.set(response.data);
      this.bootstrapState.set(BOOTSTRAP_LOAD_STATE.LOADED);
      this.authStore.setUser(response.data.user);
    } catch (error) {
      this.state.set(null);
      this.bootstrapState.set(BOOTSTRAP_LOAD_STATE.FAILED);
      this.bootstrapError.set(resolveErrorMessage(error));
      throw error;
    }
  }
}

function resolveErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'The portal bootstrap payload could not be loaded.';
}
