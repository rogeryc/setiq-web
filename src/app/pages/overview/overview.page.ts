import { DecimalPipe } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ChartCardComponent } from '../../shared/chart-card/chart-card';
import { DonutChartComponent, DonutSegment } from '../../shared/donut-chart/donut-chart';
import { FeaturedRecCardComponent, RecAction } from '../../shared/featured-rec-card/featured-rec-card';
import { KpiCardComponent, KpiDelta } from '../../shared/kpi-card/kpi-card';
import { MemoAction, MemoCardComponent, MemoSeverity } from '../../shared/memo-card/memo-card';

interface KpiViewModel {
  label: string;
  value: string;
  unit?: string;
  delta?: KpiDelta;
  sub?: string;
  spark?: number[];
  sparkTone?: KpiDelta['tone'];
}

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
export class OverviewPage {
  // Placeholder data — drop-in target for an API service later.
  readonly leadHeadline = 'Thalma está siendo escuchada.';
  readonly leadHeadlineEm = 'Y empezando a pedir cosas.';
  readonly leadCopy =
    'Sentimiento estable salvo después de la nota del lunes en Rosario, donde un sector concentró críticas. La audiencia de TikTok empuja una serie sobre vivienda — la oportunidad tiene 3 meses.';

  readonly kpis: KpiViewModel[] = [
    {
      label: 'Interacciones',
      value: '2.614',
      delta: { label: '↑ 12%', tone: 'pos' },
      sub: 'vs mes anterior',
    },
    {
      label: 'Sentimiento',
      value: '0,68',
      delta: { label: '↓ 4 pp', tone: 'neg' },
      sub: 'esta semana',
      spark: [12, 14, 11, 9, 13, 15, 14, 12, 14, 18, 22, 26, 22, 19],
      sparkTone: 'neg',
    },
    {
      label: 'Sin resolver',
      value: '41',
      delta: { label: '12 altas', tone: 'warn' },
      sub: 'prioridad de servicio',
    },
    {
      label: 'TMR · Kaizen',
      value: '18',
      unit: 'min',
      delta: { label: 'SLA', tone: 'pos' },
      sub: 'objetivo < 30min',
    },
  ];

  readonly featuredRec = {
    title: 'La nota sobre vivienda está disparando',
    titleEm: '57 comentarios negativos',
    titleTail: 'en 72h.',
    body:
      'Las críticas se concentran en lectoras de Rosario y Córdoba que sienten que dejaste fuera el costo en provincias. ' +
      'Sentimiento general aún positivo (0,72), pero el cluster geográfico es contenible si respondés con una nota lateral esta semana.',
    confidence: '92%',
    age: 'hace 1h',
    impact: 'Impacto: corte de viralización en Twitter / Threads',
    actions: [
      { label: 'Abrir hilo · Pasar a borrador', route: '/inbox', variant: 'acc' as const },
      { label: 'Asignar a Sole', variant: 'ghost' as const },
    ] satisfies RecAction[],
  };

  readonly channelDonut: DonutSegment[] = [
    { label: 'Instagram', value: 1184, color: '#E1306C' },
    { label: 'Facebook', value: 612, color: '#1877F2' },
    { label: 'TikTok', value: 487, color: '#000000' },
    { label: 'Email', value: 331, color: '#6E6E6E' },
  ];

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

  readonly channelTotal = '2.614';
  readonly topGrowthChannel = 'TikTok +28%';
}
