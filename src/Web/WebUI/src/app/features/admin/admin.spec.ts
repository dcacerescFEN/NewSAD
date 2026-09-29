import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthStore } from '../auth/services/auth-store';
import { Admin } from './admin';
import { Impersonation } from './services/impersonation';

interface AdminComponentAccess {
  form: { controls: { userName: { setValue(value: string): void } } };
  startImpersonation(): Promise<void>;
  stopImpersonation(): Promise<void>;
}

function createFixture(isImpersonating = false) {
  let impersonating = isImpersonating;
  const start = vi.fn().mockResolvedValue(undefined);
  const stop = vi.fn().mockResolvedValue(undefined);
  const navigateByUrl = vi.fn().mockResolvedValue(true);

  TestBed.configureTestingModule({
    imports: [Admin],
    providers: [
      {
        provide: AuthStore,
        useValue: {
          authenticatedUsername: () => 'keycloak-admin',
          isImpersonating: () => impersonating,
        },
      },
      { provide: Impersonation, useValue: { start, stop } },
      { provide: Router, useValue: { navigateByUrl } },
    ],
  });

  const fixture = TestBed.createComponent(Admin);
  fixture.detectChanges();
  return {
    fixture,
    start,
    stop,
    navigateByUrl,
    setImpersonating: (value: boolean) => (impersonating = value),
  };
}

describe('Admin', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('renders the Keycloak administrator and only one target-account input', () => {
    const { fixture } = createFixture();

    expect(fixture.nativeElement.textContent).toContain('keycloak-admin');
    expect(fixture.nativeElement.querySelectorAll('input')).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('#user-name')).not.toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Contraseña');
  });

  it('starts impersonation with only the requested account and shows the success state', async () => {
    const { fixture, start, navigateByUrl } = createFixture();
    const component = fixture.componentInstance as unknown as AdminComponentAccess;
    component.form.controls.userName.setValue('target-user');

    await component.startImpersonation();
    fixture.detectChanges();

    expect(start).toHaveBeenCalledWith('target-user');
    expect(fixture.nativeElement.textContent).toContain('Suplantación iniciada correctamente');
    expect(navigateByUrl).toHaveBeenCalledWith('/students');
  });

  it('shows an accessible error when impersonation cannot start', async () => {
    const { fixture, start } = createFixture();
    const component = fixture.componentInstance as unknown as AdminComponentAccess;
    start.mockRejectedValueOnce(new Error('request failed'));
    component.form.controls.userName.setValue('target-user');

    await component.startImpersonation();
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector('[role="alert"]');
    expect(error?.textContent).toContain('No fue posible iniciar la suplantación.');
  });

  it('offers and completes ending an active impersonation', async () => {
    const { fixture, stop, setImpersonating } = createFixture(true);
    const component = fixture.componentInstance as unknown as AdminComponentAccess;

    expect(fixture.nativeElement.textContent).toContain('Terminar suplantación');
    expect(fixture.nativeElement.querySelectorAll('input')).toHaveLength(0);

    await component.stopImpersonation();
    setImpersonating(false);
    fixture.detectChanges();

    expect(stop).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.textContent).toContain('La suplantación terminó correctamente.');
  });
});
