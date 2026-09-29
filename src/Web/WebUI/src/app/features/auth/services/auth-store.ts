import { computed, Injectable, signal } from '@angular/core';
import Keycloak from 'keycloak-js';
import { ROLES } from '../../../core/roles';

interface KeycloakClientAccess {
  roles?: unknown;
}

interface KeycloakResourceAccess {
  [clientId: string]: KeycloakClientAccess;
}

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly keycloakSignal = signal<Keycloak | null>(null);
  private readonly clientIdSignal = signal<string | null>(null);
  private readonly impersonationSignal = signal<ImpersonationContext | null>(null);

  readonly isAuthenticated = computed(() => this.keycloakSignal()?.authenticated === true);
  readonly authenticatedUsername = computed(
    () => this.keycloakSignal()?.tokenParsed?.['preferred_username'] as string | undefined,
  );
  readonly username = computed(
    () => this.impersonationSignal()?.userName ?? this.authenticatedUsername(),
  );
  readonly permissions = computed(() => this.getPermissions());
  readonly isImpersonating = computed(() => this.impersonationSignal() !== null);
  readonly hasGlobalAccess = computed(() =>
    this.getRoles().some((role) => role === ROLES.ADMIN || role === ROLES.SUPERADMIN),
  );

  setKeycloak(keycloak: Keycloak, clientId: string): void {
    this.keycloakSignal.set(keycloak);
    this.clientIdSignal.set(clientId);
  }

  async login(returnUrl: string): Promise<void> {
    await this.keycloakSignal()?.login({ redirectUri: `${window.location.origin}${returnUrl}` });
  }

  async logout(): Promise<void> {
    this.impersonationSignal.set(null);
    const keycloak = this.keycloakSignal();
    keycloak?.clearToken();
    await keycloak?.logout({ redirectUri: window.location.origin });
  }

  async getValidToken(minValidity = 30): Promise<string | null> {
    const keycloak = this.keycloakSignal();
    if (!keycloak?.authenticated) return null;

    try {
      await keycloak.updateToken(minValidity);
      return keycloak.token ?? null;
    } catch {
      // A refresh failure must not end the Keycloak SSO session during an active navigation.
      keycloak.clearToken();
      return null;
    }
  }

  hasPermission(permission: string): boolean {
    return this.hasGlobalAccess() || this.getPermissions().includes(permission);
  }

  private getPermissions(): string[] {
    const impersonation = this.impersonationSignal();
    if (impersonation) return impersonation.permissions;

    return this.getClientAccessValues()
      .filter((value) => value.startsWith('PERMISSION_'))
      .map((value) => value.slice('PERMISSION_'.length));
  }

  setImpersonation(context: ImpersonationContext): void {
    this.impersonationSignal.set(context);
  }

  stopImpersonation(): void {
    this.impersonationSignal.set(null);
  }

  private getRoles(): string[] {
    const impersonation = this.impersonationSignal();
    if (impersonation) return impersonation.roles;

    return this.getClientAccessValues()
      .filter((value) => value.startsWith('ROLE_'))
      .map((value) => value.slice('ROLE_'.length));
  }

  private getClientAccessValues(): string[] {
    const clientId = this.clientIdSignal();
    const value: unknown = this.keycloakSignal()?.tokenParsed?.['resource_access'];
    if (!clientId || !this.isResourceAccess(value)) return [];

    const roles = value[clientId]?.roles;
    return Array.isArray(roles)
      ? roles.filter((role): role is string => typeof role === 'string')
      : [];
  }

  private isResourceAccess(value: unknown): value is KeycloakResourceAccess {
    return typeof value === 'object' && value !== null;
  }
}

export interface ImpersonationContext {
  userName: string;
  roles: string[];
  permissions: string[];
}
