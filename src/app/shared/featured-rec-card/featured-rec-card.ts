import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { IconComponent } from '../../core/icons/icon';

export interface RecAction {
  label: string;
  route?: string | null;   // if set → renders as routerLink
  variant?: 'acc' | 'ghost' | null;
}

@Component({
  selector: 'app-featured-rec-card',
  imports: [IconComponent, RouterLink],
  templateUrl: './featured-rec-card.html',
})
export class FeaturedRecCardComponent {
  readonly title = input.required<string>();
  readonly titleEm = input<string | null>(null);
  readonly titleTail = input<string | null>(null);
  readonly body = input.required<string>();
  readonly confidence = input<string | null>(null);
  readonly age = input<string | null>(null);
  readonly impact = input<string | null>(null);
  readonly actions = input<RecAction[]>([]);
}
