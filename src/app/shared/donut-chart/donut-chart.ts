import { Component, computed, input } from '@angular/core';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;       // e.g. '#E1306C'
}

interface DonutArc {
  d: string;
  color: string;
}

/**
 * 140×140 donut chart. Computes arc paths from segment values.
 * Outer radius 66, inner radius 47.
 */
@Component({
  selector: 'app-donut-chart',
  template: `
    <svg width="140" height="140" viewBox="0 0 140 140" style="color: var(--ink)">
      @for (arc of arcs(); track $index) {
        <path [attr.d]="arc.d" [attr.fill]="arc.color"/>
      }
      <text x="70" y="68" text-anchor="middle" font-size="20" font-weight="700"
            fill="currentColor" style="letter-spacing:-0.02em;font-variant-numeric:tabular-nums">
        {{ centerValue() }}
      </text>
      @if (centerLabel(); as cl) {
        <text x="70" y="84" text-anchor="middle" font-size="9.5"
              fill="currentColor" opacity="0.55"
              style="letter-spacing:0.06em;text-transform:uppercase;font-weight:600">
          {{ cl }}
        </text>
      }
    </svg>
  `,
  styles: [`:host { display: block; }`],
})
export class DonutChartComponent {
  readonly segments = input.required<DonutSegment[]>();
  readonly centerValue = input.required<string>();
  readonly centerLabel = input<string | null>(null);

  private readonly OUTER = 66;
  private readonly INNER = 47;
  private readonly CENTER = 70;

  protected readonly arcs = computed<DonutArc[]>(() => {
    const segs = this.segments();
    const total = segs.reduce((s, v) => s + v.value, 0) || 1;
    let start = -Math.PI / 2; // start at top
    return segs.map((seg) => {
      const angle = (seg.value / total) * Math.PI * 2;
      const end = start + angle;
      const d = this.donutPath(start, end);
      start = end;
      return { d, color: seg.color };
    });
  });

  private donutPath(startAngle: number, endAngle: number): string {
    const r1 = this.OUTER;
    const r2 = this.INNER;
    const c = this.CENTER;
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    const x1o = c + r1 * Math.cos(startAngle);
    const y1o = c + r1 * Math.sin(startAngle);
    const x2o = c + r1 * Math.cos(endAngle);
    const y2o = c + r1 * Math.sin(endAngle);
    const x1i = c + r2 * Math.cos(endAngle);
    const y1i = c + r2 * Math.sin(endAngle);
    const x2i = c + r2 * Math.cos(startAngle);
    const y2i = c + r2 * Math.sin(startAngle);
    return [
      `M ${x1o.toFixed(2)},${y1o.toFixed(2)}`,
      `A ${r1} ${r1} 0 ${largeArc} 1 ${x2o.toFixed(2)},${y2o.toFixed(2)}`,
      `L ${x1i.toFixed(2)},${y1i.toFixed(2)}`,
      `A ${r2} ${r2} 0 ${largeArc} 0 ${x2i.toFixed(2)},${y2i.toFixed(2)}`,
      'Z',
    ].join(' ');
  }
}
