import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SiteConfig } from '../models/site-config';
import { SiteConfigService } from '../services/site-config';

const EMPTY_CONFIG: SiteConfig = {
  studentsMenuUrl: '',
  teachersMenuUrl: '',
  coursesMenuUrl: '',
  examsMenuUrl: '',
  activitiesMenuUrl: '',
  assistantsMenuUrl: '',
  processesMenuUrl: '',
  administrationMenuUrl: ''
};

@Injectable({
  providedIn: 'root',
})
export class ConfigStore {
  private readonly siteConfigService = inject(SiteConfigService);

  private readonly state = signal<SiteConfig>(EMPTY_CONFIG);
  private readonly loaded = signal(false);
  private loadPromise: Promise<void> | null = null;

  readonly config = this.state.asReadonly();

  async load(): Promise<void> {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.loadInternal();

    try {
      await this.loadPromise;
    } finally {
      this.loadPromise = null;
    }
  }

  hasValidConfig(): boolean {
    return this.loaded();
  }

  private async loadInternal(): Promise<void> {
    try {
      const response = await firstValueFrom(this.siteConfigService.getSiteConfig());

      if (!response.success || !response.data) {
        throw new Error(response.message || 'No fue posible cargar la configuración del sitio.');
      }

      this.state.set(this.normalize(response.data));
      this.loaded.set(true);
    } catch (error) {
      if (this.hasValidConfig()) {
        return;
      }

      throw error;
    }
  }

  private normalize(config: Partial<SiteConfig>): SiteConfig {
    const safeUrl = (value: unknown): string => {
      if (typeof value !== 'string') return '';
      const trimmed = value.trim();
      if (!/^https?:\/\/[^\s/]+(?:\/|\?|#|$)/i.test(trimmed) || /[\u0000-\u001f\u007f]/.test(trimmed)) return '';
      try {
        const url = new URL(trimmed);
        return (url.protocol === 'https:' || url.protocol === 'http:') && url.hostname && !url.username && !url.password
          ? trimmed : '';
      } catch {
        return '';
      }
    };
    return {
      studentsMenuUrl: safeUrl(config.studentsMenuUrl),
      teachersMenuUrl: safeUrl(config.teachersMenuUrl),
      coursesMenuUrl: safeUrl(config.coursesMenuUrl),
      examsMenuUrl: safeUrl(config.examsMenuUrl),
      activitiesMenuUrl: safeUrl(config.activitiesMenuUrl),
      assistantsMenuUrl: safeUrl(config.assistantsMenuUrl),
      processesMenuUrl: safeUrl(config.processesMenuUrl),
      administrationMenuUrl: safeUrl(config.administrationMenuUrl),
    };
  }
}
