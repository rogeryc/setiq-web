import { Component, input } from '@angular/core';

export type MemoSeverity = 'low' | 'med' | 'high';

export interface MemoAction {
  label: string;
  route?: string;
  variant?: 'acc' | 'ghost' | 'default';
}

@Component({
  selector: 'app-memo-card',
  templateUrl: './memo-card.html',
})
export class MemoCardComponent {
  readonly severity = input<MemoSeverity>('med');
  readonly tag = input.required<string>();
  readonly confidence = input<string>();
  readonly title = input.required<string>();
  readonly titleEm = input<string>();
  readonly body = input.required<string>();
  readonly actions = input<MemoAction[]>([]);
  readonly footnote = input<string>();
}
