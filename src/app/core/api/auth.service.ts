import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ApiTokenResponse } from './types';

const API_BASE = '';
const STORAGE_KEY = 'setiq_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly token = signal<string | null>(null);

  /**
   * Read token from local- or sessionStorage at app boot. localStorage
   * wins (remember-me persists across sessions); sessionStorage is the
   * non-remember-me fallback that dies with the tab.
   */
  restoreFromStorage(): void {
    if (!this.isBrowser) return;
    const stored = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
    if (stored) this.token.set(stored);
  }

  async login(email: string, password: string, rememberMe: boolean): Promise<void> {
    const resp = await firstValueFrom(
      this.http.post<ApiTokenResponse>(`${API_BASE}/auth/login`, {
        email,
        password,
        remember_me: rememberMe,
      }),
    );
    this.token.set(resp.access_token);
    if (this.isBrowser) {
      const store = rememberMe ? localStorage : sessionStorage;
      store.setItem(STORAGE_KEY, resp.access_token);
      // Wipe the other store so we don't end up with a stale token there.
      (rememberMe ? sessionStorage : localStorage).removeItem(STORAGE_KEY);
    }
  }

  /**
   * No-op kept for compatibility with services written against the old
   * auto-login flow. The auth guard now guarantees the token is present
   * before any protected route renders, so services don't need to wait.
   */
  ensureLoggedIn(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Reissue the current session against a different tenant the user
   * already belongs to. Stores the new token in whichever storage held
   * the old one (preserves remember-me semantics).
   */
  async switchTenant(tenantId: string): Promise<void> {
    const resp = await firstValueFrom(
      this.http.post<ApiTokenResponse>(`${API_BASE}/auth/switch-tenant`, {
        tenant_id: tenantId,
      }),
    );
    this.token.set(resp.access_token);
    if (this.isBrowser) {
      const wasLocal = localStorage.getItem(STORAGE_KEY) !== null;
      const store = wasLocal ? localStorage : sessionStorage;
      store.setItem(STORAGE_KEY, resp.access_token);
    }
  }

  logout(): void {
    this.token.set(null);
    if (this.isBrowser) {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
    }
    this.router.navigateByUrl('/login');
  }
}
