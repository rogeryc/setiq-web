import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';

import { IconComponent } from '../../core/icons/icon';
import { IconName } from '../../core/icons/icon-set';
import { ConversationsService } from '../../core/api/conversations.service';
import {
  ApiConversationDetail,
  ApiConversationsResponse,
  GroupBy,
} from '../../core/api/types';

const GROUP_OPTIONS: { key: GroupBy; label: string }[] = [
  { key: 'intent',    label: 'Intent' },
  { key: 'channel',   label: 'Canal' },
  { key: 'sentiment', label: 'Sentimiento' },
  { key: 'thread',    label: 'Hilo' },
];

const TIME_FORMAT = new Intl.DateTimeFormat('es-BO', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'America/La_Paz',
});

const RELATIVE_FORMAT = new Intl.RelativeTimeFormat('es-BO', { numeric: 'auto' });

@Component({
  selector: 'app-inbox-page',
  imports: [IconComponent],
  templateUrl: './inbox.page.html',
  styleUrl: './inbox.page.scss',
})
export class InboxPage implements OnInit {
  private readonly service = inject(ConversationsService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly groupOptions = GROUP_OPTIONS;

  protected readonly groupBy = signal<GroupBy>('intent');
  protected readonly data = signal<ApiConversationsResponse | null>(null);
  protected readonly selectedId = signal<string | null>(null);
  protected readonly detail = signal<ApiConversationDetail | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal<boolean>(false);

  protected readonly selectedConversation = computed(() => {
    const list = this.data();
    const id = this.selectedId();
    if (!list || !id) return null;
    for (const g of list.groups) {
      const found = g.conversations.find((c) => c.id === id);
      if (found) return found;
    }
    return null;
  });

  async ngOnInit(): Promise<void> {
    if (!this.isBrowser) return;
    await this.loadList(this.groupBy());
  }

  async setGroupBy(g: GroupBy): Promise<void> {
    if (g === this.groupBy()) return;
    this.groupBy.set(g);
    await this.loadList(g);
  }

  async selectConversation(id: string): Promise<void> {
    this.selectedId.set(id);
    this.detail.set(null);
    try {
      const d = await this.service.detail(id);
      this.detail.set(d);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    }
  }

  formatTime(iso: string | undefined): string {
    if (!iso) return '';
    return TIME_FORMAT.format(new Date(iso));
  }

  formatRelative(iso: string | undefined): string {
    if (!iso) return '';
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diffMin = Math.round((then - now) / 60000);
    if (Math.abs(diffMin) < 60) return RELATIVE_FORMAT.format(diffMin, 'minute');
    const diffHr = Math.round(diffMin / 60);
    if (Math.abs(diffHr) < 48) return RELATIVE_FORMAT.format(diffHr, 'hour');
    const diffDay = Math.round(diffHr / 24);
    return RELATIVE_FORMAT.format(diffDay, 'day');
  }

  channelShort(channel: string): string {
    switch (channel) {
      case 'instagram_comment': return 'IG · com';
      case 'instagram_dm':      return 'IG · DM';
      case 'facebook_comment':  return 'FB · com';
      case 'facebook_dm':       return 'FB · DM';
      case 'tiktok_comment':    return 'TikTok';
      case 'email':             return 'Email';
      case 'whatsapp':          return 'WhatsApp';
      case 'web':               return 'Web';
      default:                  return channel;
    }
  }

  /** Map a conversation.channel (e.g. instagram_dm) → IconName for <app-icon>. */
  channelIcon(channel: string): IconName {
    if (channel.startsWith('instagram')) return 'instagram';
    if (channel.startsWith('facebook'))  return 'facebook';
    if (channel.startsWith('tiktok'))    return 'tiktok';
    if (channel === 'email')             return 'email';
    return 'email'; // fallback for web/whatsapp until we add those icons
  }

  /** Platform key for brand-color CSS class on the channel avatar. */
  channelKey(channel: string): string {
    if (channel.startsWith('instagram')) return 'instagram';
    if (channel.startsWith('facebook'))  return 'facebook';
    if (channel.startsWith('tiktok'))    return 'tiktok';
    if (channel === 'email')             return 'email';
    if (channel === 'whatsapp')          return 'whatsapp';
    return 'web';
  }

  sentimentTone(sentiment: string | undefined): 'pos' | 'neg' | 'neutral' | '' {
    if (sentiment === 'positive') return 'pos';
    if (sentiment === 'negative') return 'neg';
    if (sentiment === 'neutral')  return 'neutral';
    return '';
  }

  private async loadList(g: GroupBy): Promise<void> {
    this.loading.set(true);
    try {
      const data = await this.service.list(g);
      this.data.set(data);
      // Auto-select first conversation
      const first = data.groups[0]?.conversations[0];
      if (first && !this.selectedId()) {
        await this.selectConversation(first.id);
      }
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.loading.set(false);
    }
  }
}
