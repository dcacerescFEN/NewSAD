import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { ApiResponse } from '../../../core/models/api-response';
import type { UserSession } from '../models/user-session';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);

  checkSession() {
    return this.http.get<ApiResponse<UserSession>>('/api/auth/user-info');
  }

  startLogin(returnUrl: string): void {
    window.location.href = `/api/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`;
  }

  logout(): void {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/api/auth/logout';
    document.body.append(form);
    form.submit();
  }
}
