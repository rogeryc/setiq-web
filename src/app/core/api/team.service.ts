import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AuthService } from './auth.service';
import { ApiTeamResponse } from './types';

const API_BASE = 'http://localhost:8000';

@Injectable({ providedIn: 'root' })
export class TeamService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  async list(): Promise<ApiTeamResponse> {
    await this.auth.ensureLoggedIn();
    return firstValueFrom(
      this.http.get<ApiTeamResponse>(`${API_BASE}/team`),
    );
  }
}
