import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';

import { IconComponent } from '../../core/icons/icon';
import { IconName } from '../../core/icons/icon-set';
import { ChannelsService } from '../../core/api/channels.service';
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
  imports: [IconComponent],
  templateUrl: './channels.page.html',
  styleUrl: './channels.page.scss',
})
export class ChannelsPage implements OnInit {
  private readonly service = inject(ChannelsService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly data = signal<ApiChannelsResponse | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly busyKey = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    if (!this.isBrowser) return;
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
