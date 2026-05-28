import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AuthService } from './auth.service';
import { ApiCompetitorActivityResponse, ApiOverviewResponse } from './types';

const API_BASE = 'http://localhost:8000';

@Injectable({ providedIn: 'root' })
export class OverviewService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  /** Timestamp from the most recent successful /dashboard/overview response,
   *  used by the masthead + section header to show "datos al ...". */
  readonly lastFetchedAt = signal<Date | null>(null);

  async getOverview(): Promise<ApiOverviewResponse> {
    await this.auth.ensureLoggedIn();
    const data = await firstValueFrom(
      this.http.get<ApiOverviewResponse>(`${API_BASE}/dashboard/overview`),
    );
    this.lastFetchedAt.set(new Date(data.generated_at));
    return data;
  }

  async getCompetitorActivity(days = 7, limit = 5): Promise<ApiCompetitorActivityResponse> {
    await this.auth.ensureLoggedIn();
    return firstValueFrom(
      this.http.get<ApiCompetitorActivityResponse>(
        `${API_BASE}/dashboard/competitor-activity?days=${days}&limit=${limit}`,
      ),
    );
  }
}
