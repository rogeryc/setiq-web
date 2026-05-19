import { DecimalPipe, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { OverviewService } from '../../core/api/overview.service';
import { ApiOverviewResponse } from '../../core/api/types';
import { ChartCardComponent } from '../../shared/chart-card/chart-card';
import { DonutChartComponent, DonutSegment } from '../../shared/donut-chart/donut-chart';
import { FeaturedRecCardComponent } from '../../shared/featured-rec-card/featured-rec-card';
import { KpiCardComponent } from '../../shared/kpi-card/kpi-card';
import { MemoCardComponent } from '../../shared/memo-card/memo-card';

const CHANNEL_COLORS: Record<string, string> = {
  instagram: '#E1306C',
  facebook: '#1877F2',
  tiktok: '#000000',
  email: '#6E6E6E',
  whatsapp: '#25D366',
  web: '#9CA3AF',
};

@Component({
  selector: 'app-overview-page',
  imports: [
    DecimalPipe,
    RouterLink,
    KpiCardComponent,
    FeaturedRecCardComponent,
    ChartCardComponent,
    DonutChartComponent,
    MemoCardComponent,
  ],
  templateUrl: './overview.page.html',
  styleUrl: './overview.page.scss',
})
export class OverviewPage implements OnInit {
  private readonly overviewService = inject(OverviewService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly data = signal<ApiOverviewResponse | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly channelDonut = computed<DonutSegment[]>(() => {
    const slices = this.data()?.channel_distribution ?? [];
    return slices.map((s) => ({
      label: s.label,
      value: s.value,
      color: CHANNEL_COLORS[s.key] ?? '#9CA3AF',
    }));
  });

  protected readonly channelTotal = computed<string>(() => {
    const total = this.data()?.channel_total ?? 0;
    return total.toLocaleString('es-AR');
  });

  protected readonly topGrowthChannel = computed(
    () => this.data()?.top_growth_channel ?? '—',
  );

  private static readonly TIME_FORMAT = new Intl.DateTimeFormat('es-BO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/La_Paz',
  });

  protected readonly refreshLabel = computed(() => {
    const at = this.overviewService.lastFetchedAt();
    return at ? OverviewPage.TIME_FORMAT.format(at) : null;
  });

  async ngOnInit(): Promise<void> {
    if (!this.isBrowser) return;
    try {
      const data = await this.overviewService.getOverview();
      this.data.set(data);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    }
  }
}
