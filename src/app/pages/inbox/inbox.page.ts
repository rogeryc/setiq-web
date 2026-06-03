import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { EmptyStateComponent } from '../../shared/empty-state/empty-state';
import { IconComponent } from '../../core/icons/icon';
import { IconName } from '../../core/icons/icon-set';
import { ConversationsService } from '../../core/api/conversations.service';
import { TeamService } from '../../core/api/team.service';
import {
  ApiConversationDetail,
  ApiConversationsResponse,
  ApiTeamMember,
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
  imports: [IconComponent, FormsModule, EmptyStateComponent],
  templateUrl: './inbox.page.html',
  styleUrl: './inbox.page.scss',
})
export class InboxPage implements OnInit {
  private readonly service = inject(ConversationsService);
  private readonly team = inject(TeamService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly groupOptions = GROUP_OPTIONS;

  protected readonly groupBy = signal<GroupBy>('intent');
  protected readonly data = signal<ApiConversationsResponse | null>(null);
  protected readonly selectedId = signal<string | null>(null);
  protected readonly detail = signal<ApiConversationDetail | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal<boolean>(false);
  protected readonly members = signal<ApiTeamMember[]>([]);
  protected readonly actionBusy = signal<boolean>(false);
  protected readonly assignedLabel = signal<string | null>(null);

  // --- Client-side filters (sentiment + channel) ---
  protected readonly sentimentFilter = signal<'all' | 'positive' | 'neutral' | 'negative'>('all');
  protected readonly channelFilter = signal<'all' | 'instagram' | 'facebook' | 'tiktok' | 'email'>('all');

  protected readonly sentimentOptions = [
    { key: 'all',      label: 'Todas' },
    { key: 'positive', label: 'Positivas' },
    { key: 'neutral',  label: 'Neutrales' },
    { key: 'negative', label: 'Negativas' },
  ] as const;

  protected readonly channelOptions = [
    { key: 'all',       label: 'Todos' },
    { key: 'instagram', label: 'Instagram' },
    { key: 'facebook',  label: 'Facebook' },
    { key: 'tiktok',    label: 'TikTok' },
    { key: 'email',     label: 'Email' },
  ] as const;

  /** Data filtered by the sentiment + channel chips. Groups are
   *  preserved; empty groups are dropped so the UI doesn't show
   *  category headers with zero items. */
  protected readonly filteredData = computed(() => {
    const list = this.data();
    if (!list) return null;
    const sf = this.sentimentFilter();
    const cf = this.channelFilter();
    if (sf === 'all' && cf === 'all') return list;
    const groups = list.groups
      .map((g) => ({
        ...g,
        conversations: g.conversations.filter((c) => {
          const sentimentOk = sf === 'all' || c.sentiment === sf;
          const channelOk = cf === 'all' || (c.channel ?? '').startsWith(cf);
          return sentimentOk && channelOk;
        }),
      }))
      .filter((g) => g.conversations.length > 0);
    const total = groups.reduce((sum, g) => sum + g.conversations.length, 0);
    return { ...list, groups, total };
  });

  setSentimentFilter(s: 'all' | 'positive' | 'neutral' | 'negative'): void {
    this.sentimentFilter.set(s);
  }
  setChannelFilter(c: 'all' | 'instagram' | 'facebook' | 'tiktok' | 'email'): void {
    this.channelFilter.set(c);
  }

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
    try {
      this.members.set((await this.team.list()).members);
    } catch {
      this.members.set([]);
    }
  }

  async setGroupBy(g: GroupBy): Promise<void> {
    if (g === this.groupBy()) return;
    this.groupBy.set(g);
    // Drop any prior selection — the same id may not be in the new grouping,
    // and the detail shape changes when toggling to/from thread mode.
    this.selectedId.set(null);
    this.detail.set(null);
    await this.loadList(g);
  }

  async selectConversation(id: string): Promise<void> {
    this.selectedId.set(id);
    this.detail.set(null);
    this.assignedLabel.set(null);
    try {
      const d = await this.service.detail(id, this.groupBy() === 'thread');
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

  private applyStatus(id: string, status: string): void {
    this.data.update((list) => {
      if (!list) return list;
      return {
        ...list,
        groups: list.groups.map((g) => ({
          ...g,
          conversations: g.conversations.map((c) => (c.id === id ? { ...c, status } : c)),
        })),
      };
    });
    const d = this.detail();
    if (d && d.id === id) this.detail.set({ ...d, status });
  }

  async markResolved(): Promise<void> {
    const id = this.selectedId();
    if (!id || this.actionBusy()) return;
    this.actionBusy.set(true);
    try {
      const res = await this.service.update(id, { status: 'resolved' });
      this.applyStatus(id, res.status);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.actionBusy.set(false);
    }
  }

  async reassign(userId: string): Promise<void> {
    const id = this.selectedId();
    if (!id || !userId || this.actionBusy()) return;
    this.actionBusy.set(true);
    try {
      await this.service.update(id, { assigned_user_id: userId });
      const m = this.members().find((x) => x.id === userId);
      this.assignedLabel.set(m ? m.name : 'asignado');
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.actionBusy.set(false);
    }
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
