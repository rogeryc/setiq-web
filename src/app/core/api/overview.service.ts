import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AuthService } from './auth.service';
import { ApiOverviewResponse } from './types';

const API_BASE = 'http://localhost:8000';

@Injectable({ providedIn: 'root' })
export class OverviewService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  async getOverview(): Promise<ApiOverviewResponse> {
    await this.auth.ensureLoggedIn();
    return firstValueFrom(
      this.http.get<ApiOverviewResponse>(`${API_BASE}/dashboard/overview`),
    );
  }
}
