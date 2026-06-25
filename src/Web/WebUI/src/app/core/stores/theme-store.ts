import { computed, Injectable, signal } from '@angular/core';
import { THEME_MODE, type ThemeConfig, type ThemeMode } from '../models/portal-bootstrap';

export type ThemePreference = ThemeMode;

@Injectable({
  providedIn: 'root',
})
export class ThemeStore {
  private readonly mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  private storageKey = 'newsad.theme';
  private defaultMode: ThemePreference = THEME_MODE.AUTO;

  readonly preference = signal<ThemePreference>(THEME_MODE.AUTO);
  readonly resolvedTheme = computed<'light' | 'dark'>(() => {
    if (this.preference() === THEME_MODE.AUTO) {
      return this.mediaQuery.matches ? THEME_MODE.DARK : THEME_MODE.LIGHT;
    }

    return this.preference() === THEME_MODE.DARK ? THEME_MODE.DARK : THEME_MODE.LIGHT;
  });

  constructor() {
    this.preference.set(this.readStoredPreference(this.storageKey, this.defaultMode));
    this.applyTheme();

    this.mediaQuery.addEventListener('change', () => {
      if (this.preference() === THEME_MODE.AUTO) {
        this.applyTheme();
      }
    });
  }

  applyConfig(themeConfig: ThemeConfig): void {
    this.storageKey = themeConfig.storageKey || this.storageKey;
    this.defaultMode = this.normalizePreference(themeConfig.defaultMode);
    this.preference.set(this.readStoredPreference(this.storageKey, this.defaultMode));
    this.applyTheme();
  }

  setPreference(preference: ThemePreference): void {
    const normalizedPreference = this.normalizePreference(preference);

    this.preference.set(normalizedPreference);
    localStorage.setItem(this.storageKey, normalizedPreference);
    this.applyTheme();
  }

  private applyTheme(): void {
    const resolvedTheme = this.resolvedTheme();

    document.documentElement.setAttribute('data-bs-theme', resolvedTheme);
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    document.documentElement.style.colorScheme = resolvedTheme;
  }

  private normalizePreference(preference: string): ThemePreference {
    return preference === THEME_MODE.LIGHT || preference === THEME_MODE.DARK || preference === THEME_MODE.AUTO
      ? preference
      : THEME_MODE.AUTO;
  }

  private readStoredPreference(storageKey: string, fallback: ThemePreference): ThemePreference {
    const storedPreference = localStorage.getItem(storageKey);

    return storedPreference === THEME_MODE.LIGHT || storedPreference === THEME_MODE.DARK || storedPreference === THEME_MODE.AUTO
      ? storedPreference
      : fallback;
  }
}
