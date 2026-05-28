import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AuthService } from './auth.service';
import { ApiSearchResponse } from './types';

const API_BASE = 'http://localhost:8000';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  async search(q: string): Promise<ApiSearchResponse> {
    await this.auth.ensureLoggedIn();
    return firstValueFrom(
      this.http.get<ApiSearchResponse>(`${API_BASE}/search`, { params: { q } }),
    );
  }
}
