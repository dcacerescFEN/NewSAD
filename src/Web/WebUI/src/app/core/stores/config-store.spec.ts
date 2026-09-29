import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { afterEach, describe, expect, it } from 'vitest';
import { SiteConfigService } from '../services/site-config';
import { ConfigStore } from './config-store';

describe('ConfigStore menu destinations', () => {
  afterEach(() => TestBed.resetTestingModule());

  async function load(menu: Record<string, unknown> | undefined) {
    TestBed.configureTestingModule({
      providers: [{
        provide: SiteConfigService,
        useValue: { getSiteConfig: () => of({ success: true, data: { menu } }) },
      }],
    });
    const store = TestBed.inject(ConfigStore);
    await store.load();
    return store.config().menu;
  }

  it('keeps all eight configured HTTP(S) destinations', async () => {
    const keys = ['alumnos', 'profesores', 'cursos', 'examenes', 'actividades', 'ayudantes', 'procesos', 'administracion'];
    const menu = Object.fromEntries(keys.map(key => [key, `https://example.org/${key}`]));

    expect(await load(menu)).toEqual(menu);
  });

  it('disables missing and unsafe destinations without a route fallback', async () => {
    const menu = await load({
      alumnos: ' javascript:alert(1)',
      profesores: '/profesores',
      cursos: 'https://user:pass@example.org/',
      examenes: 'https://example.org/examenes',
      actividades: 'http://localhost:4200/actividades',
      ayudantes: '//example.org/ayudantes',
      procesos: 'file:///tmp/procesos',
      administracion: 'http:example.org',
    });

    expect(menu).toEqual({
      alumnos: '', profesores: '', cursos: '', examenes: 'https://example.org/examenes',
      actividades: 'http://localhost:4200/actividades', ayudantes: '', procesos: '', administracion: '',
    });
  });

  it('disables every destination when menu configuration is absent', async () => {
    expect(Object.values(await load(undefined))).toEqual(Array(8).fill(''));
  });
});
