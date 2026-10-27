import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { afterEach, describe, expect, it } from 'vitest';
import { AuthStore } from '../../../features/auth/services/auth-store';
import { Impersonation } from '../../../features/admin/services/impersonation';
import { ConfigStore } from '../../stores/config-store';
import { ThemeStore } from '../../stores/theme-store';
import { Header } from './header';

const destinations = [
  ['students', 'SADAlumnos', 'Alumnos'],
  ['teachers', 'SADProfesores', 'Profesores'],
  ['courses', 'SADCursos', 'Cursos'],
  ['exams', 'SADExamenes', 'Exámenes'],
  ['activities', 'SADActividades', 'Actividades'],
  ['assistants', 'SADAyudantes', 'Ayudantes'],
  ['processes', 'SADProcesos', 'Procesos'],
  ['reports', 'SADInformes', 'Informes'],
  ['administration', 'SADAdministracion', 'Administración'],
] as const;

const allClients = Object.fromEntries(destinations.map(([key, client]) => [key + 'MenuClientId', client]));
const allUrls = Object.fromEntries(destinations.map(([key]) => [key + 'MenuUrl', `https://example.org/${key}`]));

describe('Header destination navigation', () => {
  afterEach(() => TestBed.resetTestingModule());

  async function render(
    allowed: readonly string[],
    config: Record<string, string> = { ...allUrls, ...allClients },
    impersonating = false,
  ) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthStore,
          useValue: {
            hasSiteAccess: (id: string) => allowed.includes(id),
            hasGlobalAccess: () => allowed.includes('SADAdministracion'),
            isImpersonating: () => impersonating,
          },
        },
        { provide: Impersonation, useValue: {} },
        { provide: ThemeStore, useValue: { preference: signal('auto'), resolvedTheme: signal('light') } },
        { provide: ConfigStore, useValue: { config: signal(config) } },
      ],
    });
    const fixture = TestBed.createComponent(Header);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows every authorized destination as an ordinary external link', async () => {
    const root = await render(destinations.map(([, client]) => client));
    const links = root.querySelectorAll<HTMLAnchorElement>('.navbar-nav .header-nav-link[href]');
    expect(links).toHaveLength(destinations.length);
    for (const [key] of destinations) {
      expect(Array.from(links).some(link => link.getAttribute('href') === allUrls[key + 'MenuUrl'])).toBe(true);
    }
    expect(root.querySelector('.navbar-nav [routerLink]')).toBeNull();
  });

  it('places Informes immediately before Administración', async () => {
    const root = await render(['SADInformes', 'SADAdministracion']);
    const labels = Array.from(root.querySelectorAll('.navbar-nav .header-nav-link'))
      .map(link => link.querySelector('span')?.textContent?.trim());
    expect(labels).toEqual(['Informes', 'Administración']);
    expect(root.querySelector('.navbar-nav a[href="https://example.org/reports"] .bi-file-earmark-bar-graph')).not.toBeNull();
  });

  it.each(destinations)('hides %s when its exact client is not authorized', async (key, client) => {
    const allowed = destinations.map(([, value]) => value).filter(value => value !== client);
    const root = await render(allowed);
    const label = destinations.find(([name]) => name === key)?.[2];
    expect(root.querySelector('.navbar-nav')?.textContent).not.toContain(label);
    expect(root.querySelectorAll('.navbar-nav .header-nav-link')).toHaveLength(destinations.length - 1);
  });

  it('shows authorized destinations without links when their URL is absent', async () => {
    const root = await render(destinations.map(([, client]) => client), allClients);
    expect(root.querySelectorAll('.navbar-nav .header-nav-link[href]')).toHaveLength(0);
    expect(root.querySelectorAll('.navbar-nav [aria-disabled="true"]')).toHaveLength(destinations.length);
    expect(root.querySelector('.navbar-nav')?.textContent).toContain('Administración');
  });

  it('hides a destination whose configured clientId is blank or padded', async () => {
    const root = await render(['SADInformes'], { ...allUrls, ...allClients, reportsMenuClientId: ' SADInformes ' });
    expect(root.querySelector('.navbar-nav')?.textContent).not.toContain('Informes');
  });

  it('hides administration from a user without its destination authorization', async () => {
    const root = await render([]);
    expect(root.querySelectorAll('.navbar-nav .header-nav-link')).toHaveLength(0);
  });

  it('during impersonation hides destinations other than the active physical client', async () => {
    const root = await render(['SADAdministracion'], { ...allUrls, ...allClients }, true);
    expect(root.querySelectorAll('.navbar-nav .header-nav-link')).toHaveLength(1);
    expect(root.querySelector('.navbar-nav')?.textContent).toContain('Administración');
    expect(root.querySelector('.navbar-nav')?.textContent).not.toContain('Informes');
  });
});
