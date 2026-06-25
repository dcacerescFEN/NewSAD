import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { ApiResponse } from '../models/api-response';
import type { PortalBootstrap } from '../models/portal-bootstrap';

@Injectable({
  providedIn: 'root',
})
export class PortalBootstrapService {
  private readonly http = inject(HttpClient);

  getBootstrap() {
    return this.http.get<ApiResponse<PortalBootstrap>>('/api/portal/bootstrap');
  }
}
