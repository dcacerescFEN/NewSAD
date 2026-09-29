import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthStore, type ImpersonationContext } from '../../auth/services/auth-store';

type ImpersonationResponse = ImpersonationContext;

@Injectable({ providedIn: 'root' })
export class Impersonation {
  private readonly http = inject(HttpClient);
  private readonly authStore = inject(AuthStore);

  async start(userName: string): Promise<void> {
    if (this.authStore.isImpersonating()) throw new Error('An impersonation session is already active.');

    const response = await firstValueFrom(
      this.http.post<ImpersonationResponse>('/api/auth/impersonation', { userName }, {
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    this.authStore.setImpersonation(response);
  }

  async stop(): Promise<void> {
    await firstValueFrom(this.http.delete('/api/auth/impersonation'));
    this.authStore.stopImpersonation();
  }
}
