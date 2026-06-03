import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { EmptyStateComponent } from '../../shared/empty-state/empty-state';
import { IconComponent } from '../../core/icons/icon';
import { IconName } from '../../core/icons/icon-set';
import { ChannelsService } from '../../core/api/channels.service';
import { MetaOAuthService } from '../../core/api/meta-oauth.service';
import {
  ApiChannelStatus,
  ApiChannelsResponse,
  ChannelKey,
} from '../../core/api/types';

const LAST_SYNC_FORMAT = new Intl.RelativeTimeFormat('es-BO', { numeric: 'auto' });

const CHANNEL_ICONS: Record<ChannelKey, IconName> = {
  instagram: 'instagram',
  facebook:  'facebook',
  tiktok:    'tiktok',
  email:     'email',
  whatsapp:  'email', // no whatsapp icon yet — fallback
  phone:     'email', // no phone icon yet — fallback
};

@Component({
  selector: 'app-channels-page',
  imports: [IconComponent, EmptyStateComponent],
  templateUrl: './channels.page.html',
  styleUrl: './channels.page.scss',
})
export class ChannelsPage implements OnInit {
  private readonly service = inject(ChannelsService);
  private readonly metaOAuth = inject(MetaOAuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly data = signal<ApiChannelsResponse | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly busyKey = signal<string | null>(null);

  // Post-OAuth banner state — set when /canales is opened with the
  // meta_connected or meta_error query params after Meta redirect.
  protected readonly metaBanner = signal<
    | { kind: 'success'; count: number }
    | { kind: 'error'; message: string }
    | null
  >(null);
  protected readonly metaConnecting = signal(false);

  async ngOnInit(): Promise<void> {
    if (!this.isBrowser) return;
    await this.reload();
    this.consumeOAuthQueryParams();
  }

  private consumeOAuthQueryParams(): void {
    const qp = this.route.snapshot.queryParamMap;
    const ok = qp.get('meta_connected');
    const err = qp.get('meta_error');
    if (ok !== null) {
      this.metaBanner.set({ kind: 'success', count: Number(ok) || 0 });
    } else if (err) {
      this.metaBanner.set({ kind: 'error', message: err });
    }
    if (ok !== null || err) {
      // Strip the params so a reload doesn't re-trigger the banner.
      this.router.navigate([], {
        queryParams: { meta_connected: null, meta_error: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
  }

  async connectMeta(): Promise<void> {
    if (this.metaConnecting()) return;
    this.metaConnecting.set(true);
    try {
      await this.metaOAuth.startConnect();
      // Browser navigates away to Meta; never reach this line.
    } catch (e) {
      this.metaConnecting.set(false);
      this.error.set(e instanceof Error ? e.message : String(e));
    }
  }

  dismissMetaBanner(): void {
    this.metaBanner.set(null);
  }

  async reload(): Promise<void> {
    this.error.set(null);
    try {
      this.data.set(await this.service.list());
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    }
  }

  async toggleModule(c: ApiChannelStatus, module: 'setiq' | 'kaizen'): Promise<void> {
    if (!c.connected || this.busyKey()) return;
    this.busyKey.set(c.key);
    try {
      const next = !c.modules[module];
      const patch = module === 'setiq' ? { setiq: next } : { kaizen: next };
      this.data.set(await this.service.patchModules(c.key, patch));
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.busyKey.set(null);
    }
  }

  iconFor(key: ChannelKey): IconName {
    return CHANNEL_ICONS[key];
  }

  brandClass(key: ChannelKey): string {
    return key;
  }

  formatLastSync(iso: string | undefined): string {
    if (!iso) return '—';
    const then = new Date(iso).getTime();
    const diffMin = Math.round((then - Date.now()) / 60000);
    if (Math.abs(diffMin) < 60) return LAST_SYNC_FORMAT.format(diffMin, 'minute');
    const diffHr = Math.round(diffMin / 60);
    if (Math.abs(diffHr) < 48) return LAST_SYNC_FORMAT.format(diffHr, 'hour');
    return LAST_SYNC_FORMAT.format(Math.round(diffHr / 24), 'day');
  }

  statusLabel(s: ApiChannelStatus['status']): string {
    switch (s) {
      case 'active':       return 'Activo';
      case 'warning':      return 'Atención';
      case 'disconnected': return 'Desconectado';
    }
  }
}
