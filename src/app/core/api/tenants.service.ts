import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiTenantDetail } from './types';

const API_BASE = 'http://localhost:8000';

@Injectable({ providedIn: 'root' })
export class TenantsService {
  private readonly http = inject(HttpClient);

  getMe(): Promise<ApiTenantDetail> {
    return firstValueFrom(this.http.get<ApiTenantDetail>(`${API_BASE}/tenants/me`));
  }

  /**
   * JSONB-merge patch on tenants.settings. Anything you pass is merged
   * shallow with the existing settings — pass nested objects to update
   * a nested key (e.g. { channel_labels: { instagram: "@x" } }).
   */
  patchSettings(patch: Record<string, unknown>): Promise<{ settings: Record<string, unknown> }> {
    return firstValueFrom(
      this.http.patch<{ settings: Record<string, unknown> }>(`${API_BASE}/tenants/me/settings`, patch),
    );
  }

  patchModules(patch: Record<string, unknown>): Promise<{ modules: Record<string, unknown> }> {
    return firstValueFrom(
      this.http.patch<{ modules: Record<string, unknown> }>(`${API_BASE}/tenants/me/modules`, patch),
    );
  }
}
