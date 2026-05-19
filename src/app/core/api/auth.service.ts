import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';

import { ApiTokenResponse } from './types';

const API_BASE = 'http://localhost:8000';

/**
 * Minimal auth service. For dev there's a hardcoded auto-login with
 * Thalma's seeded credentials so the dashboard can show real data
 * without a login UI yet. Replace with a real form when we build it.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /** Current JWT or null. Read by the interceptor. */
  readonly token = signal<string | null>(null);

  /** A promise that resolves once we've attempted dev auto-login. */
  private autoLoginPromise: Promise<void> | null = null;

  /**
   * Trigger auto-login if it hasn't happened yet. Safe to call multiple
   * times — only one network call goes out. No-op during SSR.
   */
  ensureLoggedIn(): Promise<void> {
    if (!this.isBrowser) return Promise.resolve();
    if (this.autoLoginPromise) return this.autoLoginPromise;
    this.autoLoginPromise = this.devLogin();
    return this.autoLoginPromise;
  }

  private async devLogin(): Promise<void> {
    const resp = await firstValueFrom(
      this.http.post<ApiTokenResponse>(`${API_BASE}/auth/login`, {
        email: 'thalma@example.com',
        password: 'changeme123',
      }),
    );
    this.token.set(resp.access_token);
  }
}
