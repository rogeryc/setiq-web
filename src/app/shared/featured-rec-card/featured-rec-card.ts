import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { IconComponent } from '../../core/icons/icon';

export interface RecAction {
  label: string;
  route?: string;          // if set → renders as routerLink
  variant?: 'acc' | 'ghost';
}

@Component({
  selector: 'app-featured-rec-card',
  imports: [IconComponent, RouterLink],
  templateUrl: './featured-rec-card.html',
})
export class FeaturedRecCardComponent {
  readonly title = input.required<string>();
  readonly titleEm = input<string>();
  readonly titleTail = input<string>();
  readonly body = input.required<string>();
  readonly confidence = input<string>();
  readonly age = input<string>();
  readonly impact = input<string>();
  readonly actions = input<RecAction[]>([]);
}
