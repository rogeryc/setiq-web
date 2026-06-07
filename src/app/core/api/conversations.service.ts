import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AuthService } from './auth.service';
import {
  ApiConversationDetail,
  ApiConversationMutation,
  ApiConversationsResponse,
  ApiMessageDetail,
  GroupBy,
} from './types';

interface ReplyResponse {
  message: ApiMessageDetail;
  external_id?: string;
}

const API_BASE = '';

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

  async detail(id: string, asThread = false): Promise<ApiConversationDetail> {
    await this.auth.ensureLoggedIn();
    const params = asThread ? new HttpParams().set('as_thread', 'true') : undefined;
    return firstValueFrom(
      this.http.get<ApiConversationDetail>(
        `${API_BASE}/conversations/${id}`,
        params ? { params } : {},
      ),
    );
  }

  async update(
    id: string,
    body: { status?: string; assigned_user_id?: string },
  ): Promise<ApiConversationMutation> {
    await this.auth.ensureLoggedIn();
    return firstValueFrom(
      this.http.patch<ApiConversationMutation>(`${API_BASE}/conversations/${id}`, body),
    );
  }

  async reply(id: string, text: string): Promise<ReplyResponse> {
    await this.auth.ensureLoggedIn();
    return firstValueFrom(
      this.http.post<ReplyResponse>(`${API_BASE}/conversations/${id}/reply`, { text }),
    );
  }
}
