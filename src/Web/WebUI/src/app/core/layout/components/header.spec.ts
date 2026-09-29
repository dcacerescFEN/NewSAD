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

  async function render(globalAccess: boolean, impersonating: boolean, menu: Record<string, string>) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthStore, useValue: { hasGlobalAccess: () => globalAccess, isImpersonating: () => impersonating } },
        { provide: Impersonation, useValue: {} },
        { provide: ThemeStore, useValue: { preference: signal('auto'), resolvedTheme: signal('light') } },
        { provide: ConfigStore, useValue: { config: signal({ menu }) } },
      ],
    });
    const fixture = TestBed.createComponent(Header);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('uses ordinary external links for configured modules including an authorized administration link', async () => {
    const menu = {
      alumnos: 'https://example.org/alumnos', profesores: 'https://example.org/profesores',
      cursos: 'https://example.org/cursos', examenes: 'https://example.org/examenes',
      actividades: 'https://example.org/actividades', ayudantes: 'https://example.org/ayudantes',
      procesos: 'https://example.org/procesos', administracion: 'https://example.org/administracion',
    };
    const root = await render(true, false, menu);
    const links = root.querySelectorAll<HTMLAnchorElement>('.navbar-nav .header-nav-link[href]');

    expect(links).toHaveLength(8);
    for (const [key, url] of Object.entries(menu)) {
      expect(Array.from(links).some(link => link.getAttribute('href') === url)).toBe(true);
    }
    expect(root.querySelector('.navbar-nav [routerLink]')).toBeNull();
  });

  it('shows unavailable modules without links and hides administration during impersonation', async () => {
    const root = await render(true, true, { alumnos: '', administracion: 'https://example.org/admin' });

    expect(root.querySelectorAll('.navbar-nav .header-nav-link[href]')).toHaveLength(0);
    expect(root.querySelectorAll('.navbar-nav [aria-disabled="true"]')).toHaveLength(7);
    expect(root.querySelector('.navbar-nav')?.textContent).not.toContain('Administración');
  });

  it('hides administration for users without global access', async () => {
    const root = await render(false, false, { administracion: 'https://example.org/admin' });
    expect(root.querySelector('.navbar-nav')?.textContent).not.toContain('Administración');
  });
});
