import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Header } from './core/layout/components/header';
import { Footer } from './core/layout/components/footer';
import { Reports } from './features/reports/reports';
import { PortalStore } from './core/stores/portal-store';
import { AuthStore } from './features/auth/services/auth-store';
import { THEME_MODE, type PortalBootstrap } from './core/models/portal-bootstrap';
import { ThemeStore, type ThemePreference } from './core/stores/theme-store';

describe('NewSAD migration cutover smoke coverage', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('renders the migrated header with the preserved external navigation and shell actions', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        provideRouter([]),
        {
          provide: PortalStore,
          useValue: {
            bootstrap: signal(createBootstrap()),
          },
        },
        {
          provide: AuthStore,
          useValue: {
            displayName: signal('Ada Lovelace'),
            userName: signal('adalovelace'),
            logout: vi.fn(),
          },
        },
        {
          provide: ThemeStore,
          useValue: createThemeStoreMock(),
        },
      ],
    }).createComponent(Header);

    fixture.detectChanges();
    const nativeElement = fixture.nativeElement as HTMLElement;

    const portalLinks = Array.from(
      nativeElement.querySelectorAll('ul.navbar-nav a.header-nav-link'),
    ).map((link) => (link as HTMLAnchorElement).textContent?.replace(/\s+/g, ' ').trim());

    expect(portalLinks).toEqual([
      'Alumnos',
      'Profesores',
      'Cursos',
      'Exámenes',
      'Actividades',
      'Ayudantes',
      'Procesos',
      'Administración',
    ]);

    expect(nativeElement.textContent).toContain('Ada Lovelace');

    (nativeElement.querySelector('button[aria-label="Change theme"]') as HTMLButtonElement | null)
      ?.click();
    fixture.detectChanges();

    const themeOptions = Array.from(
      nativeElement.querySelectorAll('.theme-option'),
    ).map((option) => (option as HTMLElement).textContent?.replace(/\s+/g, ' ').trim());

    expect(themeOptions).toEqual(['Light', 'Dark', 'Auto']);

    (nativeElement.querySelector('button[aria-label="User menu"]') as HTMLButtonElement | null)
      ?.click();
    fixture.detectChanges();

    expect(nativeElement.textContent).toContain('Change password');
    expect(nativeElement.textContent).toContain('Sign out');
  });

  it('renders the migrated footer copy', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [Footer],
    }).createComponent(Footer);

    fixture.detectChanges();
    const nativeElement = fixture.nativeElement as HTMLElement;

    expect(nativeElement.textContent).toContain(
      'Facultad de Economía y Negocios - Universidad de Chile',
    );
    expect(nativeElement.textContent).toContain('Version 1.0.0');
  });

  it('keeps both Power BI views reachable inside the Angular report shell', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [Reports],
    }).createComponent(Reports);

    fixture.componentRef.setInput('reports', createBootstrap().reports);
    fixture.detectChanges();
    const nativeElement = fixture.nativeElement as HTMLElement;

    const tabs = Array.from(nativeElement.querySelectorAll('.reports__tab')) as HTMLButtonElement[];

    expect(tabs).toHaveLength(2);
    expect(tabs[0].textContent).toContain('Total Alumnos');
    expect(tabs[1].textContent).toContain('Nuevos Alumnos');
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');

    tabs[1].click();
    fixture.detectChanges();

    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    expect(nativeElement.querySelector('#report-panel-new-students app-report-frame')).not.toBeNull();
  });
});

function createBootstrap(): PortalBootstrap {
  return {
    user: {
      userName: 'adalovelace',
      displayName: 'Ada Lovelace',
      roles: ['Reader'],
      permissions: ['reports.view'],
    },
    navigationLinks: [
      { label: 'Alumnos', icon: 'bi-person-badge', url: 'https://sadalumnos-dev.fen.uchile.cl' },
      { label: 'Profesores', icon: 'bi-person-lines-fill', url: 'https://sadprofesores-dev.fen.uchile.cl' },
      { label: 'Cursos', icon: 'bi-book', url: 'https://sadcursos-dev.fen.uchile.cl' },
      { label: 'Exámenes', icon: 'bi-clipboard-check', url: 'https://sadexamenes-dev.fen.uchile.cl' },
      { label: 'Actividades', icon: 'bi-calendar-event', url: 'https://sadactividades-dev.fen.uchile.cl' },
      { label: 'Ayudantes', icon: 'bi-people', url: 'https://sadayudantes-dev.fen.uchile.cl' },
      { label: 'Procesos', icon: 'bi-gear', url: 'https://sadprocesos-dev.fen.uchile.cl' },
      { label: 'Administración', icon: 'bi-shield-lock', url: 'https://sadadministracion-dev.fen.uchile.cl' },
    ],
    reports: [
      {
        key: 'total-students',
        label: 'Total Alumnos',
        embedUrl: 'https://app.powerbi.com/view?r=report-1',
      },
      {
        key: 'new-students',
        label: 'Nuevos Alumnos',
        embedUrl: 'https://app.powerbi.com/view?r=report-2',
      },
    ],
    theme: {
      defaultMode: THEME_MODE.AUTO,
      storageKey: 'newsad.theme',
    },
  };
}

function createThemeStoreMock() {
  const preference = signal<ThemePreference>(THEME_MODE.AUTO);

  return {
    preference,
    resolvedTheme: signal<'light' | 'dark'>('light'),
    setPreference: vi.fn((value: ThemePreference) => preference.set(value)),
  };
}
