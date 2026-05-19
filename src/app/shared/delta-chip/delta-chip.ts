import { Component, input } from '@angular/core';

export type ChipTone = 'pos' | 'neg' | 'warn' | 'neutral';

@Component({
  selector: 'app-delta-chip',
  template: `<span class="s-chip" [class.pos]="tone() === 'pos'" [class.neg]="tone() === 'neg'" [class.warn]="tone() === 'warn'">{{ label() }}</span>`,
  styles: [`:host { display: contents; }`],
})
export class DeltaChipComponent {
  readonly label = input.required<string>();
  readonly tone = input<ChipTone>('neutral');
}
