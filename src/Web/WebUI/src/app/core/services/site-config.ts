import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiResponse } from '../models/api-response';
import { SiteConfig } from '../models/site-config';

@Injectable({
  providedIn: 'root',
})
export class SiteConfigService {
  private readonly http = inject(HttpClient);

  getSiteConfig() {
    return this.http.get<ApiResponse<SiteConfig>>('/api/config/site');
  }
}
