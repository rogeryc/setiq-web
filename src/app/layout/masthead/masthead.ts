import { Component, computed, inject } from '@angular/core';

import { IconComponent } from '../../core/icons/icon';
import { OverviewService } from '../../core/api/overview.service';
import { ThemeService } from '../../core/theme.service';

const TIME_FORMAT = new Intl.DateTimeFormat('es-BO', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'America/La_Paz',
});

@Component({
  selector: 'app-masthead',
  imports: [IconComponent],
  templateUrl: './masthead.html',
})
export class MastheadComponent {
  readonly theme = inject(ThemeService);
  private readonly overview = inject(OverviewService);

  readonly tenantLabel = 'Thalma · Bolivia';
  readonly userInitials = 'TH';

  readonly nowLabel = computed(() => {
    const at = this.overview.lastFetchedAt();
    return at ? TIME_FORMAT.format(at) : '— actualizando…';
  });
}
