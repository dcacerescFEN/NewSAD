import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { afterEach, describe, expect, it } from 'vitest';
import { SiteConfigService } from '../services/site-config';
import { ConfigStore } from './config-store';

const modules = ['students', 'teachers', 'courses', 'exams', 'activities', 'assistants', 'processes', 'reports', 'administration'];
const emptyClients = Object.fromEntries(modules.map(name => [name + 'MenuClientId', '']));

describe('ConfigStore menu destinations', () => {
  afterEach(() => TestBed.resetTestingModule());

  async function load(config: Record<string, unknown> | undefined) {
    TestBed.configureTestingModule({ providers: [{ provide: SiteConfigService,
      useValue: { getSiteConfig: () => of({ success: true, data: config ?? {} }) } }] });
    const store = TestBed.inject(ConfigStore);
    await store.load();
    return store.config();
  }

  it('keeps all nine configured HTTP(S) destinations', async () => {
    const config = Object.fromEntries(modules.map(name => [name + 'MenuUrl', `https://example.org/${name}`]));
    expect(await load(config)).toEqual({ ...config, ...emptyClients });
  });

  it('disables missing and unsafe destinations without a route fallback', async () => {
    const config = await load({
      studentsMenuUrl: ' javascript:alert(1)', teachersMenuUrl: '/profesores',
      coursesMenuUrl: 'https://user:pass@example.org/', examsMenuUrl: '  https://example.org/examenes  ',
      activitiesMenuUrl: 'http://localhost:4200/actividades', assistantsMenuUrl: '//example.org/ayudantes',
      processesMenuUrl: 'file:///tmp/procesos', administrationMenuUrl: 'http:example.org',
      reportsMenuUrl: 'https://user:pass@example.org/',
    });
    expect(config).toEqual({ ...emptyClients,
      studentsMenuUrl: '', teachersMenuUrl: '', coursesMenuUrl: '', examsMenuUrl: 'https://example.org/examenes',
      activitiesMenuUrl: 'http://localhost:4200/actividades', assistantsMenuUrl: '', processesMenuUrl: '',
      reportsMenuUrl: '', administrationMenuUrl: '',
    });
  });

  it('disables every destination and client when configuration is absent', async () => {
    expect(Object.values(await load(undefined))).toEqual(Array(18).fill(''));
  });

  it('preserves exact physical client IDs independently of URLs', async () => {
    const clients = Object.fromEntries(modules.map((name, i) => [name + 'MenuClientId', `client-${i}-iis`]));
    const config = await load({ ...clients, reportsMenuUrl: 'https://reports.test' });
    expect(config).toMatchObject({ ...clients, reportsMenuUrl: 'https://reports.test' });
  });

  it.each([undefined, null, 42, {}, '', ' SADInformes-iis '])('does not infer or trim a client from %j', async value => {
    const clients = Object.fromEntries(modules.map(name => [name + 'MenuClientId', value]));
    const config = await load({ ...clients, reportsMenuUrl: 'https://reports.test' });
    expect(config).toMatchObject(Object.fromEntries(modules.map(name =>
      [name + 'MenuClientId', typeof value === 'string' ? value : ''])));
  });
});
