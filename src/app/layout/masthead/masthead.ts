import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { AuthService } from '../../core/api/auth.service';
import { IconComponent } from '../../core/icons/icon';
import { MeService } from '../../core/api/me.service';
import { OverviewService } from '../../core/api/overview.service';
import { ThemeService } from '../../core/theme.service';
import { SearchPaletteComponent } from '../../shared/search-palette/search-palette';

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
  imports: [IconComponent, SearchPaletteComponent],
  templateUrl: './masthead.html',
})
export class MastheadComponent implements OnInit {
  readonly theme = inject(ThemeService);
  private readonly overview = inject(OverviewService);
  private readonly me = inject(MeService);
  private readonly auth = inject(AuthService);

  readonly tenantLabel = this.me.tenantLabel;
  readonly userInitials = this.me.initials;
  readonly modulesLabel = this.me.modulesLabel;
  readonly userEmail = computed(() => this.me.me()?.email ?? '');
  readonly userName = computed(() => this.me.me()?.name ?? '');

  protected readonly menuOpen = signal(false);

  readonly nowLabel = computed(() => {
    const at = this.overview.lastFetchedAt();
    return at ? TIME_FORMAT.format(at) : '— actualizando…';
  });

  ngOnInit(): void {
    this.me.ensureLoaded().catch(() => {/* 401 interceptor will redirect */});
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  logout(): void {
    this.menuOpen.set(false);
    this.me.reset();
    this.auth.logout();
  }
}
