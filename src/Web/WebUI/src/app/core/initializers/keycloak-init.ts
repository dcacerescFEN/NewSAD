import Keycloak from 'keycloak-js';
import { AuthStore } from '../../features/auth/services/auth-store';

interface KeycloakConfig {
  url: string;
  realm: string;
  clientId: string;
}

function isKeycloakConfig(value: unknown): value is KeycloakConfig {
  return typeof value === 'object'
    && value !== null
    && 'url' in value
    && 'realm' in value
    && 'clientId' in value
    && typeof value.url === 'string'
    && typeof value.realm === 'string'
    && typeof value.clientId === 'string';
}

export function initializeKeycloak(authStore: AuthStore) {
  return async (): Promise<void> => {
    const response = await fetch('/api/config/keycloak');
    const config: unknown = await response.json();

    if (!response.ok || !isKeycloakConfig(config) || !config.url || !config.realm || !config.clientId) {
      throw new Error('Keycloak configuration is invalid.');
    }

    const keycloak = new Keycloak(config);
    authStore.setKeycloak(keycloak, config.clientId);

    await keycloak.init({
      onLoad: 'check-sso',
      pkceMethod: 'S256',
      responseMode: 'query',
      checkLoginIframe: false,
    });

    keycloak.onTokenExpired = () => {
      void keycloak.updateToken(30).catch(() => undefined);
    }
  };
}
