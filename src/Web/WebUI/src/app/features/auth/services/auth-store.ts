import { computed, Injectable, signal } from '@angular/core';
import Keycloak from 'keycloak-js';
import { ROLES } from '../../../core/roles';

interface KeycloakClientAccess {
  roles?: unknown;
}

interface KeycloakResourceAccess {
  [clientId: string]: KeycloakClientAccess;
}

interface SiteAccessPolicy {
  module: string;
  permission?: string;
}

// Los permisos de entrada no confirmados se omiten: no se infieren equivalencias.
const SITE_ACCESS_POLICIES = new Map<string, SiteAccessPolicy>([
  ['NewSAD', { module: 'SAD', permission: 'SAD_ACCESS' }],
  ['SADAlumnos', { module: 'STUDENT', permission: 'STUDENT_ACCESS_STUDENT_MODULE' }],
  ['SADInformes', { module: 'REPORT', permission: 'REPORT_ACCESS' }],
  ['SADAdministracion', { module: 'ADMINISTRATION', permission: 'ADMINISTRATION_ACCESS' }],
  ['SADProfesores', { module: 'TEACHER' }],
  ['SADCursos', { module: 'COURSE' }],
  ['SADExamenes', { module: 'EXAM' }],
  ['SADActividades', { module: 'ACTIVITY' }],
  ['SADAyudantes', { module: 'ASSISTANT' }],
  ['SADProcesos', { module: 'PROCESS' }],
]);

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

  /**
   * Consulta el cliente físico exacto del destino, sin mezclarlo con su variante -iis.
   * En suplantación solo se autoriza el cliente activo con los permisos efectivos.
   */
  hasSiteAccess(clientId: string): boolean {
    if (!this.isAuthenticated()) return false;

    const logicalId = clientId.endsWith('-iis') ? clientId.slice(0, -4) : clientId;
    const policy = SITE_ACCESS_POLICIES.get(logicalId);
    if (!policy) return false;

    const impersonation = this.impersonationSignal();
    if (impersonation) {
      if (clientId !== this.clientIdSignal()) return false;
      return impersonation.roles.includes(policy.module + '_ADMIN')
        || impersonation.roles.includes(policy.module + '_SUPERADMIN')
        || (policy.permission !== undefined && impersonation.permissions.includes(policy.permission));
    }

    const access: unknown = this.keycloakSignal()?.tokenParsed?.['resource_access'];
    if (!this.isResourceAccess(access) || !Object.prototype.hasOwnProperty.call(access, clientId))
      return false;
    const roles = access[clientId]?.roles;
    if (!Array.isArray(roles)) return false;

    return roles.includes('ROLE_' + policy.module + '_ADMIN')
      || roles.includes('ROLE_' + policy.module + '_SUPERADMIN')
      || (policy.permission !== undefined && roles.includes('PERMISSION_' + policy.permission));
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
