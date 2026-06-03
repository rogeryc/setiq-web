import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  ApiTrackedSubject,
  ApiTrackedSubjectCreate,
  ApiTrackedSubjectUpdate,
} from './types';

const API_BASE = 'http://localhost:8000';

@Injectable({ providedIn: 'root' })
export class TrackedSubjectsService {
  private readonly http = inject(HttpClient);

  list(): Promise<ApiTrackedSubject[]> {
    return firstValueFrom(this.http.get<ApiTrackedSubject[]>(`${API_BASE}/tracked-subjects`));
  }

  create(body: ApiTrackedSubjectCreate): Promise<ApiTrackedSubject> {
    return firstValueFrom(
      this.http.post<ApiTrackedSubject>(`${API_BASE}/tracked-subjects`, body),
    );
  }

  update(id: string, body: ApiTrackedSubjectUpdate): Promise<ApiTrackedSubject> {
    return firstValueFrom(
      this.http.patch<ApiTrackedSubject>(`${API_BASE}/tracked-subjects/${id}`, body),
    );
  }

  remove(id: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`${API_BASE}/tracked-subjects/${id}`),
    );
  }
}
