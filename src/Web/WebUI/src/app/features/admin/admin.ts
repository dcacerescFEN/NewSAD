import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthStore } from '../auth/services/auth-store';
import { Impersonation } from './services/impersonation';

@Component({
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="admin-page" aria-labelledby="admin-title">
      <div class="container py-4 py-md-5 h-100">
        <div class="row justify-content-center align-items-center h-100">
          <div class="col-12 col-md-8 col-lg-6 col-xl-5">
            <article class="card admin-card shadow-2-strong">
              <div class="card-body p-4 p-md-5">
                <img
                  class="admin-logo rounded mx-auto d-block"
                  src="/logo-fen-only-isotype.svg"
                  alt="Facultad de Economía y Negocios"
                  height="100"
                />

                <h1 id="admin-title" class="admin-title">Administración</h1>
                <p class="authenticated-user" aria-label="Administrador autenticado">
                  <i class="bi bi-person-gear" aria-hidden="true"></i>
                  <span>Autenticado como:</span>
                  <strong>{{ authStore.authenticatedUsername() ?? 'Usuario autenticado' }}</strong>
                </p>

                @if (authStore.isImpersonating()) {
                  <div class="alert alert-warning" role="status">
                    Hay una suplantación activa. Terminála antes de iniciar otra.
                  </div>
                  <button
                    class="btn btn-outline-danger btn-lg w-100"
                    type="button"
                    (click)="stopImpersonation()"
                    [disabled]="submitting()"
                  >
                    @if (submitting()) {
                      <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                      Finalizando suplantación...
                    } @else {
                      Terminar suplantación
                    }
                  </button>
                } @else {
                  <p class="admin-instructions">Ingresá la cuenta que querés suplantar.</p>
                  <form class="mt-4" [formGroup]="form" (ngSubmit)="startImpersonation()">
                    <div class="form-floating mb-4">
                      <input
                        id="user-name"
                        class="form-control form-control-lg"
                        type="text"
                        formControlName="userName"
                        placeholder="Cuenta"
                        autocomplete="username"
                        [attr.aria-invalid]="
                          form.controls.userName.invalid && form.controls.userName.touched
                        "
                        [attr.aria-describedby]="errorMessage() ? 'impersonation-error' : null"
                        required
                      />
                      <label for="user-name"
                        ><i class="bi bi-person" aria-hidden="true"></i> Cuenta a suplantar</label
                      >
                    </div>

                    @if (errorMessage()) {
                      <p id="impersonation-error" class="alert alert-danger" role="alert">
                        {{ errorMessage() }}
                      </p>
                    }
                    @if (successMessage()) {
                      <p class="alert alert-success" role="status">{{ successMessage() }}</p>
                    }

                    <button
                      class="btn btn-primary btn-lg w-100"
                      type="submit"
                      [disabled]="form.invalid || submitting()"
                    >
                      @if (submitting()) {
                        <span
                          class="spinner-border spinner-border-sm me-2"
                          aria-hidden="true"
                        ></span>
                        Iniciando suplantación...
                      } @else {
                        Suplantar
                      }
                    </button>
                    <button
                      class="btn btn-link w-100 mt-2"
                      type="button"
                      (click)="cancel()"
                      [disabled]="submitting()"
                    >
                      Cancelar
                    </button>
                  </form>
                }
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .admin-page {
      min-height: 100%;
      background: var(--layout-background);
    }

    .admin-card {
      border: 0;
      border-radius: 1rem;
      background: var(--layout-surface-strong);
      color: var(--layout-text);
      box-shadow: 0 20px 60px -20px rgb(0 0 0 / 50%);
    }

    .admin-logo {
      max-width: 100%;
    }

    .admin-title {
      width: fit-content;
      min-height: 2rem;
      margin: 1.25rem auto;
      padding: 0.3rem 1.25rem;
      border-radius: 100px;
      background: #c8102e;
      color: #fff;
      font-size: 1rem;
      font-weight: 600;
      text-align: center;
    }

    .authenticated-user {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.35rem;
      margin-bottom: 1.5rem;
      color: var(--layout-muted-text);
      font-size: 0.9rem;
    }

    .authenticated-user strong {
      color: var(--layout-text);
    }

    .admin-instructions {
      margin-bottom: 0;
      color: var(--layout-muted-text);
      text-align: center;
    }

    .form-floating > label {
      color: var(--primary-blue);
      font-weight: 600;
    }

    .form-control:focus {
      border-color: var(--primary-blue);
      box-shadow: 0 0 0 0.25rem rgb(0 59 122 / 25%);
    }

    .btn-primary {
      background-color: var(--primary-blue);
      border-color: transparent;
    }
    .btn-primary:hover {
      background-color: var(--primary-blue-deep);
    }

    @media (max-width: 575.98px) {
      .container {
        padding-inline: 1rem;
      }
      .card-body {
        padding-inline: 1.25rem !important;
      }
    }
  `,
})
export class Admin {
  private readonly formBuilder = inject(FormBuilder);
  private readonly impersonation = inject(Impersonation);
  private readonly router = inject(Router);
  protected readonly authStore = inject(AuthStore);

  protected readonly form = this.formBuilder.nonNullable.group({
    userName: ['', [Validators.required]],
  });
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly submitting = signal(false);

  protected async startImpersonation(): Promise<void> {
    if (this.form.invalid || this.submitting()) return;

    this.submitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    try {
      await this.impersonation.start(this.form.getRawValue().userName);
      this.successMessage.set('Suplantación iniciada correctamente. Redirigiendo...');
      await this.router.navigateByUrl('/students');
    } catch {
      this.errorMessage.set('No fue posible iniciar la suplantación.');
    } finally {
      this.submitting.set(false);
    }
  }

  protected cancel(): void {
    void this.router.navigateByUrl('/students');
  }

  protected async stopImpersonation(): Promise<void> {
    if (this.submitting()) return;

    this.submitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    try {
      await this.impersonation.stop();
      this.successMessage.set('La suplantación terminó correctamente.');
    } catch {
      this.errorMessage.set('No fue posible terminar la suplantación.');
    } finally {
      this.submitting.set(false);
    }
  }
}
