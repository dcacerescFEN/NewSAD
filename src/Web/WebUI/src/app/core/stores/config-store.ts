import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MenuDestinations, SiteConfig } from '../models/site-config';
import { SiteConfigService } from '../services/site-config';

const EMPTY_CONFIG: SiteConfig = {
  menu: { alumnos: '', profesores: '', cursos: '', examenes: '', actividades: '', ayudantes: '', procesos: '', administracion: '' },
  defaultSemester: '',
  defaultSemesterPostgraduate: '',
  pregraduateStudentTypes: [],
  academicSituationsForModifyGrades: [],
  specialGradeRecordAllowedAcademicSituations: [],
  otherRequestTypesWithoutReason: [],
  adminProcessingAllowedTypes: [],
  fileAttachmentExcludedRequestType: '',
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

  isPregraduateStudentType(studentType: string | null | undefined): boolean {
    if (!studentType) {
      return false;
    }

    return this.state().pregraduateStudentTypes.some(type => type.toUpperCase() === studentType.toUpperCase());
  }

  private normalize(config: Partial<SiteConfig>): SiteConfig {
    const menu = config.menu;
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
    const normalizedMenu: MenuDestinations = {
      alumnos: safeUrl(menu?.alumnos),
      profesores: safeUrl(menu?.profesores),
      cursos: safeUrl(menu?.cursos),
      examenes: safeUrl(menu?.examenes),
      actividades: safeUrl(menu?.actividades),
      ayudantes: safeUrl(menu?.ayudantes),
      procesos: safeUrl(menu?.procesos),
      administracion: safeUrl(menu?.administracion),
    };
    return {
      menu: normalizedMenu,
      defaultSemester: config.defaultSemester ?? '',
      defaultSemesterPostgraduate: config.defaultSemesterPostgraduate ?? '',
      pregraduateStudentTypes: this.normalizeArray(config.pregraduateStudentTypes),
      academicSituationsForModifyGrades: this.normalizeArray(config.academicSituationsForModifyGrades),
      specialGradeRecordAllowedAcademicSituations: this.normalizeArray(config.specialGradeRecordAllowedAcademicSituations),
      otherRequestTypesWithoutReason: this.normalizeArray(config.otherRequestTypesWithoutReason),
      adminProcessingAllowedTypes: this.normalizeArray(config.adminProcessingAllowedTypes),
      fileAttachmentExcludedRequestType: config.fileAttachmentExcludedRequestType ?? '',
    };
  }

  private normalizeArray(values: string[] | undefined): string[] {
    return Array.isArray(values) ? values.filter(Boolean) : [];
  }
}
