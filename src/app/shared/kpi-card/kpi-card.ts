import { Component, input } from '@angular/core';

import { ChipTone, DeltaChipComponent } from '../delta-chip/delta-chip';
import { SparklineComponent } from '../sparkline/sparkline';

export interface KpiDelta {
  label: string;
  tone: ChipTone;
}

@Component({
  selector: 'app-kpi-card',
  imports: [DeltaChipComponent, SparklineComponent],
  templateUrl: './kpi-card.html',
})
export class KpiCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly delta = input<KpiDelta>();
  readonly sub = input<string>();
  readonly unit = input<string>();
  readonly spark = input<number[]>();
  readonly sparkTone = input<ChipTone>('neutral');
}
