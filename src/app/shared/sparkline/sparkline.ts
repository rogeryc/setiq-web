import { Component, computed, input } from '@angular/core';

type SparkTone = 'pos' | 'neg' | 'warn' | 'neutral';

/**
 * Inline SVG sparkline. Takes a series of numbers; auto-fits a 300×36
 * path. Color follows the tone (mapped to CSS custom properties from
 * the SETIQ palette).
 */
@Component({
  selector: 'app-sparkline',
  template: `
    <svg class="s-kpi-spark" viewBox="0 0 300 36" preserveAspectRatio="none"
         [style.color]="strokeColor()" aria-hidden="true">
      <path fill="currentColor" fill-opacity="0.10" [attr.d]="areaPath()"/>
      <path fill="none" stroke="currentColor" stroke-width="1.6"
            stroke-linecap="round" stroke-linejoin="round"
            [attr.d]="linePath()"/>
      <circle [attr.cx]="lastPoint().x" [attr.cy]="lastPoint().y" r="3" fill="currentColor"/>
    </svg>
  `,
  styles: [`:host { display: block; }`],
})
export class SparklineComponent {
  readonly points = input.required<number[]>();
  readonly tone = input<SparkTone>('neutral');

  protected readonly strokeColor = computed(() => {
    const t = this.tone();
    if (t === 'pos') return 'var(--pos)';
    if (t === 'neg') return 'var(--neg)';
    if (t === 'warn') return 'var(--warn)';
    return 'var(--acc-bright)';
  });

  private readonly scaled = computed(() => {
    const pts = this.points();
    if (pts.length === 0) return [] as { x: number; y: number }[];
    const min = Math.min(...pts);
    const max = Math.max(...pts);
    const range = max - min || 1;
    return pts.map((v, i) => ({
      x: (i / Math.max(pts.length - 1, 1)) * 300,
      y: 32 - ((v - min) / range) * 28, // pad 4 top/bottom
    }));
  });

  protected readonly linePath = computed(() => {
    const s = this.scaled();
    if (s.length === 0) return '';
    return s.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  });

  protected readonly areaPath = computed(() => {
    const line = this.linePath();
    const s = this.scaled();
    if (s.length === 0) return '';
    return `${line} L ${s[s.length - 1].x.toFixed(1)},36 L ${s[0].x.toFixed(1)},36 Z`;
  });

  protected readonly lastPoint = computed(() => {
    const s = this.scaled();
    return s.length ? s[s.length - 1] : { x: 0, y: 0 };
  });
}
