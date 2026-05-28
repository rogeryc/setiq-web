import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AuthService } from './auth.service';
import {
  ApiTrackedSubject,
  ApiTrackedSubjectCreate,
  ApiTrackedSubjectUpdate,
} from './types';

const API_BASE = 'http://localhost:8000';

@Injectable({ providedIn: 'root' })
export class TrackedSubjectsService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  async list(): Promise<ApiTrackedSubject[]> {
    await this.auth.ensureLoggedIn();
    return firstValueFrom(
      this.http.get<ApiTrackedSubject[]>(`${API_BASE}/tracked-subjects`),
    );
  }

  async create(body: ApiTrackedSubjectCreate): Promise<ApiTrackedSubject> {
    await this.auth.ensureLoggedIn();
    return firstValueFrom(
      this.http.post<ApiTrackedSubject>(`${API_BASE}/tracked-subjects`, body),
    );
  }

  async update(id: string, body: ApiTrackedSubjectUpdate): Promise<ApiTrackedSubject> {
    await this.auth.ensureLoggedIn();
    return firstValueFrom(
      this.http.patch<ApiTrackedSubject>(`${API_BASE}/tracked-subjects/${id}`, body),
    );
  }

  async remove(id: string): Promise<void> {
    await this.auth.ensureLoggedIn();
    await firstValueFrom(
      this.http.delete<void>(`${API_BASE}/tracked-subjects/${id}`),
    );
  }
}
