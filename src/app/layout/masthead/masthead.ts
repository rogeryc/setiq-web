import { Component, inject } from '@angular/core';

import { IconComponent } from '../../core/icons/icon';
import { ThemeService } from '../../core/theme.service';

@Component({
  selector: 'app-masthead',
  imports: [IconComponent],
  templateUrl: './masthead.html',
})
export class MastheadComponent {
  readonly theme = inject(ThemeService);

  // Static for now; will become inputs / async data once we wire the API.
  readonly tenantLabel = 'Thalma · Argentina';
  readonly userInitials = 'TH';
  readonly nowLabel = 'vie · 19 may · 14:32 ART';
}
