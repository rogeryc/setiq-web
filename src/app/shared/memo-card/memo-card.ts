import { Component, input } from '@angular/core';

export type MemoSeverity = 'low' | 'med' | 'high';

export interface MemoAction {
  label: string;
  variant?: 'acc' | 'ghost' | 'default' | null;
}

@Component({
  selector: 'app-memo-card',
  templateUrl: './memo-card.html',
})
export class MemoCardComponent {
  readonly severity = input<MemoSeverity>('med');
  readonly tag = input.required<string>();
  readonly confidence = input<string | null>(null);
  readonly title = input.required<string>();
  readonly titleEm = input<string | null>(null);
  readonly body = input.required<string>();
  readonly actions = input<MemoAction[]>([]);
  readonly footnote = input<string | null>(null);
}
