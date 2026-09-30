import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { afterEach, describe, expect, it } from 'vitest';
import { SiteConfigService } from '../services/site-config';
import { ConfigStore } from './config-store';

describe('ConfigStore menu destinations', () => {
  afterEach(() => TestBed.resetTestingModule());

  async function load(config: Record<string, unknown> | undefined) {
    TestBed.configureTestingModule({
      providers: [{
        provide: SiteConfigService,
        useValue: { getSiteConfig: () => of({ success: true, data: config ?? {} }) },
      }],
    });
    const store = TestBed.inject(ConfigStore);
    await store.load();
    return store.config();
  }

  it('keeps all eight configured HTTP(S) destinations', async () => {
    const keys = ['studentsMenuUrl', 'teachersMenuUrl', 'coursesMenuUrl', 'examsMenuUrl', 'activitiesMenuUrl', 'assistantsMenuUrl', 'processesMenuUrl', 'administrationMenuUrl'];
    const config = Object.fromEntries(keys.map(key => [key, `https://example.org/${key}`]));

    expect(await load(config)).toEqual(config);
  });

  it('disables missing and unsafe destinations without a route fallback', async () => {
    const config = await load({
      studentsMenuUrl: ' javascript:alert(1)',
      teachersMenuUrl: '/profesores',
      coursesMenuUrl: 'https://user:pass@example.org/',
      examsMenuUrl: '  https://example.org/examenes  ',
      activitiesMenuUrl: 'http://localhost:4200/actividades',
      assistantsMenuUrl: '//example.org/ayudantes',
      processesMenuUrl: 'file:///tmp/procesos',
      administrationMenuUrl: 'http:example.org',
    });

    expect(config).toEqual({
      studentsMenuUrl: '', teachersMenuUrl: '', coursesMenuUrl: '', examsMenuUrl: 'https://example.org/examenes',
      activitiesMenuUrl: 'http://localhost:4200/actividades', assistantsMenuUrl: '', processesMenuUrl: '', administrationMenuUrl: '',
    });
  });

  it('disables every destination when flat configuration is absent', async () => {
    expect(Object.values(await load(undefined))).toEqual(Array(8).fill(''));
  });
});
