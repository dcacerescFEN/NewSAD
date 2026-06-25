import type { UserSession } from '../../features/auth/models/user-session';

export const THEME_MODE = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',
} as const;

export type ThemeMode = (typeof THEME_MODE)[keyof typeof THEME_MODE];

export interface NavigationLink {
  label: string;
  icon: string;
  url: string;
}

export interface ReportItem {
  key: string;
  label: string;
  embedUrl: string;
}

export interface ThemeConfig {
  defaultMode: ThemeMode;
  storageKey: string;
}

export interface PortalBootstrap {
  user: UserSession;
  navigationLinks: NavigationLink[];
  reports: ReportItem[];
  theme: ThemeConfig;
}
