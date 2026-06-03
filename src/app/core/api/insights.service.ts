import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AuthService } from './auth.service';
import { ApiInsightsResponse, InsightKind } from './types';

const API_BASE = '';

type KindFilter = InsightKind | 'all';

@Injectable({ providedIn: 'root' })
export class InsightsService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  async list(kind: KindFilter = 'all'): Promise<ApiInsightsResponse> {
    await this.auth.ensureLoggedIn();
    const params = new HttpParams().set('kind', kind);
    return firstValueFrom(
      this.http.get<ApiInsightsResponse>(`${API_BASE}/insights`, { params }),
    );
  }
}
