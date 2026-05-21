import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiUserMe } from './types';

const API_BASE = 'http://localhost:8000';

/**
 * Caches the current /auth/me response. Single shared singleton so the
 * masthead, settings page, etc. all read the same source of truth.
 */
@Injectable({ providedIn: 'root' })
export class MeService {
  private readonly http = inject(HttpClient);

  readonly me = signal<ApiUserMe | null>(null);
  private loadPromise: Promise<ApiUserMe> | null = null;

  /** Derived helpers consumed by templates. */
  readonly tenantLabel = computed(() => {
    const m = this.me();
    return m ? `${m.tenant.name} · Bolivia` : '— · Bolivia';
  });
  readonly initials = computed(() => this.me()?.initials ?? '··');
  readonly modulesLabel = computed(() => {
    const mods = this.me()?.tenant.modules ?? {};
    const parts: string[] = [];
    if ('setiq' in mods) parts.push('Core');
    if ('kaizen' in mods && (mods['kaizen'] as { enabled?: boolean } | undefined)?.enabled) {
      parts.push('Kaizen');
    }
    return parts.length ? parts.join(' + ') : 'Core';
  });

  /** Fire-and-forget; safe to call repeatedly — only one request goes out. */
  ensureLoaded(): Promise<ApiUserMe> {
    if (this.loadPromise) return this.loadPromise;
    this.loadPromise = firstValueFrom(this.http.get<ApiUserMe>(`${API_BASE}/auth/me`)).then(
      (m) => {
        this.me.set(m);
        return m;
      },
      (err) => {
        this.loadPromise = null;
        throw err;
      },
    );
    return this.loadPromise;
  }

  reset(): void {
    this.me.set(null);
    this.loadPromise = null;
  }
}
