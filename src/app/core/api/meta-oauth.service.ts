import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

const API_BASE = 'http://localhost:8000';

interface ConnectResponse {
  url: string;
}

/**
 * Meta OAuth handoff. Kicking off `connect()` asks the backend for the
 * pre-built Meta dialog URL, then redirects the browser there. After
 * the user consents on Meta, Meta redirects to /auth/meta/callback (the
 * backend), which finishes the exchange and 302s back to /canales with
 * ?meta_connected=<n> or ?meta_error=<reason>.
 */
@Injectable({ providedIn: 'root' })
export class MetaOAuthService {
  private readonly http = inject(HttpClient);

  async startConnect(): Promise<void> {
    const resp = await firstValueFrom(
      this.http.get<ConnectResponse>(`${API_BASE}/auth/meta/connect`),
    );
    // Hard navigation: leaves SETIQ entirely. After the round-trip, we
    // land back on /canales (full page reload, signals fresh).
    window.location.href = resp.url;
  }

  async disconnect(pageId: string): Promise<void> {
    await firstValueFrom(
      this.http.post(`${API_BASE}/auth/meta/disconnect`, null, {
        params: { page_id: pageId },
      }),
    );
  }
}
