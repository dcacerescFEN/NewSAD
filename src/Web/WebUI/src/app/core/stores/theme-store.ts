import { computed, Injectable, signal } from '@angular/core';

export type ThemePreference = 'light' | 'dark' | 'auto';
type ResolvedTheme = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeStore {
  private readonly storageKey = 'sadalumnos-theme-preference';
  private readonly mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  readonly preference = signal<ThemePreference>(this.getStoredPreference());
  readonly resolvedTheme = computed<ResolvedTheme>(() => {
    const preference = this.preference();

    if (preference === 'auto') {
      return this.mediaQuery.matches ? 'dark' : 'light';
    }

    return preference;
  });

  constructor() {
    this.applyTheme();
    this.mediaQuery.addEventListener('change', () => {
      if (this.preference() === 'auto') {
        this.applyTheme();
      }
    });
  }

  setPreference(preference: ThemePreference): void {
    this.preference.set(preference);
    localStorage.setItem(this.storageKey, preference);
    this.applyTheme();
  }

  private applyTheme(): void {
    const resolvedTheme = this.resolvedTheme();

    document.documentElement.setAttribute('data-bs-theme', resolvedTheme);
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    document.documentElement.style.colorScheme = resolvedTheme;
  }

  private getStoredPreference(): ThemePreference {
    const storedPreference = localStorage.getItem(this.storageKey);

    return storedPreference === 'light' || storedPreference === 'dark' || storedPreference === 'auto'
      ? storedPreference
      : 'auto';
  }
}
