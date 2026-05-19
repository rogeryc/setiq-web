import { Injectable, signal } from '@angular/core';

/**
 * Drives the `.dark` class on the root `.app` element.
 * The design ships dark-first to match the SETIQ landing.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly dark = signal(true);

  toggle(): void {
    this.dark.update((v) => !v);
  }
}
