import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { InsightsService } from '../../core/api/insights.service';
import { ApiInsight, ApiInsightAction, ApiInsightsResponse } from '../../core/api/types';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state';

type ContextCat = 'audiencia' | 'temas' | 'pares';
type Filter = 'todas' | ContextCat;

interface ContextRow {
  id: string;
  cat: ContextCat;
  tag: string;
  text: string;
  when: string;
}

@Component({
  selector: 'app-recomendaciones-page',
  imports: [EmptyStateComponent, RouterLink],
  templateUrl: './recomendaciones.page.html',
  styleUrl: './recomendaciones.page.scss',
})
export class RecomendacionesPage implements OnInit {
  private readonly service = inject(InsightsService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly data = signal<ApiInsightsResponse | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly filter = signal<Filter>('todas');
  protected readonly expanded = signal(false);
  protected readonly heroDismissed = signal(false);

  /** The single most urgent recommendation — pinned to the top hero. */
  protected readonly hero = computed<ApiInsight | null>(() => {
    const all = this.data()?.insights ?? [];
    return all.find((i) => i.kind === 'featured' && i.severity === 'high')
        ?? all.find((i) => i.kind === 'featured')
        ?? null;
  });

  /** Remaining featured recs — the "this week" tier. Max 2 cards. */
  protected readonly weekCards = computed<ApiInsight[]>(() => {
    const hero = this.hero();
    const featured = (this.data()?.insights ?? []).filter((i) => i.kind === 'featured');
    return featured.filter((i) => i.id !== hero?.id).slice(0, 2);
  });

  /** All context memos, one row each — with derived category for filtering. */
  protected readonly allContext = computed<ContextRow[]>(() => {
    return (this.data()?.insights ?? [])
      .filter((i) => i.kind === 'memo')
      .map((m) => this.toContextRow(m));
  });

  protected readonly filteredContext = computed<ContextRow[]>(() => {
    const f = this.filter();
    const rows = this.allContext();
    return f === 'todas' ? rows : rows.filter((r) => r.cat === f);
  });

  protected readonly visibleContext = computed<ContextRow[]>(() => {
    return this.expanded() ? this.filteredContext() : this.filteredContext().slice(0, 5);
  });

  protected readonly hiddenCount = computed(
    () => this.filteredContext().length - this.visibleContext().length,
  );

  protected readonly totalCount = computed(() => this.data()?.total ?? 0);

  protected readonly filterOptions = computed<{ key: Filter; label: string }[]>(() => [
    { key: 'todas',     label: 'Todas · ' + this.allContext().length },
    { key: 'audiencia', label: 'Tu audiencia' },
    { key: 'temas',     label: 'Tus temas' },
    { key: 'pares',     label: 'Tus pares' },
  ]);

  async ngOnInit(): Promise<void> {
    if (!this.isBrowser) return;
    await this.reload();
  }

  async reload(): Promise<void> {
    this.error.set(null);
    try {
      this.data.set(await this.service.list());
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    }
  }

  setFilter(f: Filter): void {
    this.filter.set(f);
    this.expanded.set(false); // reset collapse when filter changes
  }

  toggleExpanded(): void {
    this.expanded.update((v) => !v);
  }

  dismissHero(): void {
    this.heroDismissed.set(true);
  }

  restoreHero(): void {
    this.heroDismissed.set(false);
  }

  /** Turn a memo insight into a compact context row. */
  private toContextRow(m: ApiInsight): ContextRow {
    const cat = this.deriveCategory(m);
    return {
      id: m.id,
      cat,
      tag: this.tagLabel(cat),
      text: m.title,
      when: m.age || this.relativeCreated(m.created_at),
    };
  }

  /**
   * Map the free-form insight.tag into one of the three context categories.
   * Falls back to 'temas' when nothing matches (safest bucket — topic-adjacent).
   * When Phase 2 lands a real `category` column on the backend, this becomes
   * `m.category ?? deriveCategory(m)`.
   */
  private deriveCategory(m: ApiInsight): ContextCat {
    const t = (m.tag || '').toLowerCase();
    if (t.includes('audien')) return 'audiencia';
    if (t.includes('par') || t.includes('competi') || t.includes('rival')) return 'pares';
    return 'temas';
  }

  private tagLabel(c: ContextCat): string {
    return c === 'audiencia' ? 'AUDIENCIA' : c === 'pares' ? 'PARES' : 'TEMA';
  }

  private relativeCreated(iso: string): string {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const h = Math.round((now - then) / 3_600_000);
    if (h < 1) return 'hace un rato';
    if (h < 24) return `hace ${h} h`;
    const d = Math.round(h / 24);
    return d === 1 ? 'ayer' : `hace ${d} días`;
  }

  /** First action = primary CTA on hero/cards; rest are secondary. */
  primaryAction(a: ApiInsightAction[]): ApiInsightAction | null {
    return a[0] ?? null;
  }

  secondaryAction(a: ApiInsightAction[]): ApiInsightAction | null {
    return a[1] ?? null;
  }
}
