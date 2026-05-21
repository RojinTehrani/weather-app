// services/theme.service.ts
import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  currentTheme = signal<string>('mytheme');
  isDarkMode = signal<boolean>(true);

  constructor() {
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme) {
      this.currentTheme.set(savedTheme);
      this.isDarkMode.set(savedTheme === 'mytheme');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.isDarkMode.set(prefersDark);
      this.currentTheme.set(prefersDark ? 'mytheme' : 'light');
    }

    this.applyTheme();

    effect(() => {
      this.applyTheme();
      localStorage.setItem('theme', this.currentTheme());
    });
  }

  toggleTheme() {
    if (this.isDarkMode()) {
      this.currentTheme.set('light');
      this.isDarkMode.set(false);
    } else {
      this.currentTheme.set('mytheme');
      this.isDarkMode.set(true);
    }
  }

  private applyTheme() {
    document.documentElement.setAttribute('data-theme', this.currentTheme());
  }
}