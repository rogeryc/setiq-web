import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';

import { InsightsService } from '../../core/api/insights.service';
import { ApiInsight, ApiInsightsResponse, InsightKind } from '../../core/api/types';
import { FeaturedRecCardComponent } from '../../shared/featured-rec-card/featured-rec-card';
import { MemoCardComponent } from '../../shared/memo-card/memo-card';

type Filter = InsightKind | 'all';

@Component({
  selector: 'app-recomendaciones-page',
  imports: [FeaturedRecCardComponent, MemoCardComponent],
  templateUrl: './recomendaciones.page.html',
  styleUrl: './recomendaciones.page.scss',
})
export class RecomendacionesPage implements OnInit {
  private readonly service = inject(InsightsService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly data = signal<ApiInsightsResponse | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly filter = signal<Filter>('all');

  protected readonly filterOptions = computed<{ key: Filter; label: string; count: number }[]>(() => {
    const d = this.data();
    if (!d) return [];
    const c = d.counts;
    return [
      { key: 'all',      label: 'Todas',        count: d.total },
      { key: 'lead',     label: 'Resumen',      count: c.lead ?? 0 },
      { key: 'featured', label: 'Destacadas',   count: c.featured ?? 0 },
      { key: 'memo',     label: 'Memos',        count: c.memo ?? 0 },
    ];
  });

  protected readonly lead = computed<ApiInsight | null>(() => {
    const f = this.filter();
    if (f !== 'all' && f !== 'lead') return null;
    return this.data()?.insights.find((i) => i.kind === 'lead') ?? null;
  });

  protected readonly featured = computed<ApiInsight[]>(() => {
    const f = this.filter();
    if (f !== 'all' && f !== 'featured') return [];
    return (this.data()?.insights ?? []).filter((i) => i.kind === 'featured');
  });

  protected readonly memos = computed<ApiInsight[]>(() => {
    const f = this.filter();
    if (f !== 'all' && f !== 'memo') return [];
    return (this.data()?.insights ?? []).filter((i) => i.kind === 'memo');
  });

  async ngOnInit(): Promise<void> {
    if (!this.isBrowser) return;
    try {
      this.data.set(await this.service.list());
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    }
  }

  setFilter(f: Filter): void {
    this.filter.set(f);
  }

  memoSeverity(s: 'low' | 'med' | 'high' | undefined): 'low' | 'med' | 'high' {
    return s ?? 'med';
  }
}
