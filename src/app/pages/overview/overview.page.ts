import { DecimalPipe, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { OverviewService } from '../../core/api/overview.service';
import { ApiOverviewResponse } from '../../core/api/types';
import { ChartCardComponent } from '../../shared/chart-card/chart-card';
import { DonutChartComponent, DonutSegment } from '../../shared/donut-chart/donut-chart';
import { FeaturedRecCardComponent, RecAction } from '../../shared/featured-rec-card/featured-rec-card';
import { KpiCardComponent } from '../../shared/kpi-card/kpi-card';
import { MemoAction, MemoCardComponent, MemoSeverity } from '../../shared/memo-card/memo-card';

interface MemoViewModel {
  severity: MemoSeverity;
  tag: string;
  confidence?: string;
  title: string;
  titleEm?: string;
  body: string;
  actions?: MemoAction[];
  footnote?: string;
}

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

  // Derived view-models from the API response. Stay static for content
  // we haven't wired yet (lead copy, featured rec, memos).
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

  // Static placeholders until backend exposes recommendations/memos.
  readonly leadHeadline = 'Thalma está siendo escuchada.';
  readonly leadHeadlineEm = 'Y empezando a pedir cosas.';
  readonly leadCopy =
    'Sentimiento estable salvo después de la nota del lunes en Santa Cruz, donde un sector concentró críticas. La audiencia de TikTok empuja una serie sobre vivienda — la oportunidad tiene 3 meses.';

  readonly featuredRec = {
    title: 'La nota sobre vivienda está disparando',
    titleEm: '57 comentarios negativos',
    titleTail: 'en 72h.',
    body:
      'Las críticas se concentran en lectoras de Santa Cruz y Cochabamba que sienten que dejaste fuera el costo fuera del eje troncal. ' +
      'Sentimiento general aún positivo (0,72), pero el cluster geográfico es contenible si respondés con una nota lateral esta semana.',
    confidence: '92%',
    age: 'hace 1h',
    impact: 'Impacto: corte de viralización en Twitter / Threads',
    actions: [
      { label: 'Abrir hilo · Pasar a borrador', route: '/inbox', variant: 'acc' as const },
      { label: 'Asignar a Sole', variant: 'ghost' as const },
    ] satisfies RecAction[],
  };

  readonly memos: MemoViewModel[] = [
    {
      severity: 'med',
      tag: 'Memo 02 · Oportunidad',
      confidence: 'Confianza 81%',
      title: 'Audiencia 18-24 pidiendo',
      titleEm: 'serie sobre alquileres',
      body:
        'Detectamos 87 menciones espontáneas en TikTok pidiendo una serie sobre alquileres y subarriendos, concentradas ' +
        'en mujeres 18-24. Sugerimos probar un primer episodio antes de comprometer una serie completa.',
      actions: [{ label: 'Crear segmento', variant: 'acc' }],
      footnote: 'Potencial: 12-18%',
    },
    {
      severity: 'med',
      tag: 'Memo 03 · Audiencia',
      confidence: 'Confianza 88%',
      title: 'Cluster emergente: 184 lectoras-promotoras orgánicas',
      body:
        'Identificamos un cluster de 184 cuentas con sentimiento sostenido sobre 0,9 en los últimos 60 días, sin ningún ' +
        'programa formal. Recomendamos formalizar contacto antes que otros newsletters las capten.',
      actions: [{ label: 'Exportar segmento' }],
      footnote: 'Base embajadoras',
    },
    {
      severity: 'low',
      tag: 'Memo 04 · Operación',
      confidence: 'Confianza 74%',
      title: 'TMR domingos en 1h 42min',
      body:
        'El tiempo medio de primera respuesta los domingos supera el SLA en 3,4×. Recomendamos reasignar un agente del ' +
        'lunes al domingo durante los próximos 4 fines de semana para evaluar impacto.',
      actions: [{ label: 'Ver calendario' }],
      footnote: 'SLA en 4 semanas',
    },
  ];

  readonly topGrowthChannel = computed(
    () => this.data()?.top_growth_channel ?? '—',
  );

  async ngOnInit(): Promise<void> {
    // Browser-only: SSR has no auth context, so the request would 401.
    // The client picks up after hydration and fetches real data.
    if (!this.isBrowser) return;
    try {
      const data = await this.overviewService.getOverview();
      this.data.set(data);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    }
  }
}
