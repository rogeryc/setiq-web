import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AuthService } from './auth.service';
import {
  ApiConversationDetail,
  ApiConversationsResponse,
  GroupBy,
} from './types';

const API_BASE = 'http://localhost:8000';

@Injectable({ providedIn: 'root' })
export class ConversationsService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  async list(groupBy: GroupBy): Promise<ApiConversationsResponse> {
    await this.auth.ensureLoggedIn();
    return firstValueFrom(
      this.http.get<ApiConversationsResponse>(`${API_BASE}/conversations`, {
        params: new HttpParams().set('group_by', groupBy),
      }),
    );
  }

  async detail(id: string): Promise<ApiConversationDetail> {
    await this.auth.ensureLoggedIn();
    return firstValueFrom(
      this.http.get<ApiConversationDetail>(`${API_BASE}/conversations/${id}`),
    );
  }
}
