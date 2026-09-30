import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { afterEach, describe, expect, it } from 'vitest';
import { AuthStore } from '../../../features/auth/services/auth-store';
import { Impersonation } from '../../../features/admin/services/impersonation';
import { ConfigStore } from '../../stores/config-store';
import { ThemeStore } from '../../stores/theme-store';
import { Header } from './header';

describe('Header module navigation', () => {
  afterEach(() => TestBed.resetTestingModule());

  async function render(globalAccess: boolean, impersonating: boolean, config: Record<string, string>) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthStore, useValue: { hasGlobalAccess: () => globalAccess, isImpersonating: () => impersonating } },
        { provide: Impersonation, useValue: {} },
        { provide: ThemeStore, useValue: { preference: signal('auto'), resolvedTheme: signal('light') } },
        { provide: ConfigStore, useValue: { config: signal(config) } },
      ],
    });
    const fixture = TestBed.createComponent(Header);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('uses ordinary external links for configured modules including an authorized administration link', async () => {
    const config = {
      studentsMenuUrl: 'https://example.org/alumnos', teachersMenuUrl: 'https://example.org/profesores',
      coursesMenuUrl: 'https://example.org/cursos', examsMenuUrl: 'https://example.org/examenes',
      activitiesMenuUrl: 'https://example.org/actividades', assistantsMenuUrl: 'https://example.org/ayudantes',
      processesMenuUrl: 'https://example.org/procesos', administrationMenuUrl: 'https://example.org/administracion',
    };
    const root = await render(true, false, config);
    const links = root.querySelectorAll<HTMLAnchorElement>('.navbar-nav .header-nav-link[href]');

    expect(links).toHaveLength(8);
    for (const url of Object.values(config)) {
      expect(Array.from(links).some(link => link.getAttribute('href') === url)).toBe(true);
    }
    expect(root.querySelector('.navbar-nav [routerLink]')).toBeNull();
  });

  it('shows unavailable modules without links and hides administration during impersonation', async () => {
    const root = await render(true, true, { studentsMenuUrl: '', administrationMenuUrl: 'https://example.org/admin' });

    expect(root.querySelectorAll('.navbar-nav .header-nav-link[href]')).toHaveLength(0);
    expect(root.querySelectorAll('.navbar-nav [aria-disabled="true"]')).toHaveLength(7);
    expect(root.querySelector('.navbar-nav')?.textContent).not.toContain('Administración');
  });

  it('hides administration for users without global access', async () => {
    const root = await render(false, false, { administrationMenuUrl: 'https://example.org/admin' });
    expect(root.querySelector('.navbar-nav')?.textContent).not.toContain('Administración');
  });

  it('shows administration as unavailable for authorized users when its URL is absent', async () => {
    const root = await render(true, false, {});
    expect(root.querySelector('.navbar-nav')?.textContent).toContain('Administración');
    expect(root.querySelectorAll('.navbar-nav .header-nav-link[href]')).toHaveLength(0);
    expect(root.querySelectorAll('.navbar-nav [aria-disabled="true"]')).toHaveLength(8);
  });
});
