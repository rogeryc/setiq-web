import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiInviteRequest, ApiInviteResponse, ApiTeamResponse } from './types';

const API_BASE = '';

@Injectable({ providedIn: 'root' })
export class TeamService {
  private readonly http = inject(HttpClient);

  list(): Promise<ApiTeamResponse> {
    return firstValueFrom(this.http.get<ApiTeamResponse>(`${API_BASE}/team`));
  }

  invite(body: ApiInviteRequest): Promise<ApiInviteResponse> {
    return firstValueFrom(
      this.http.post<ApiInviteResponse>(`${API_BASE}/team/invite`, body),
    );
  }
}
