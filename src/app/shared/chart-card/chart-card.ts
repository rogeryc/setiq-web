import { Component, input } from '@angular/core';

/**
 * Generic card wrapper for any chart-like content. Slots in:
 *   <app-chart-card title="Canales" meta="30 días">
 *     <app-donut-chart .../>
 *     <ng-container chart-footer>...</ng-container>
 *   </app-chart-card>
 */
@Component({
  selector: 'app-chart-card',
  template: `
    <article class="s-chart">
      <header class="h">
        <div class="ttl">
          <h4>{{ title() }}</h4>
          @if (meta(); as m) { <span class="meta">{{ m }}</span> }
        </div>
      </header>
      <ng-content />
      <ng-content select="[chart-footer]" />
    </article>
  `,
})
export class ChartCardComponent {
  readonly title = input.required<string>();
  readonly meta = input<string>();
}
