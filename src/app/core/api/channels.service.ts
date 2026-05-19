import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AuthService } from './auth.service';
import { ApiChannelsResponse } from './types';

const API_BASE = 'http://localhost:8000';

@Injectable({ providedIn: 'root' })
export class ChannelsService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  async list(): Promise<ApiChannelsResponse> {
    await this.auth.ensureLoggedIn();
    return firstValueFrom(
      this.http.get<ApiChannelsResponse>(`${API_BASE}/channels`),
    );
  }
}
