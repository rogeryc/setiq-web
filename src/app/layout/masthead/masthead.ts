import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

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
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly tenantLabel = this.me.tenantLabel;
  readonly userInitials = this.me.initials;
  readonly modulesLabel = this.me.modulesLabel;
  readonly userEmail = computed(() => this.me.me()?.email ?? '');
  readonly userName = computed(() => this.me.me()?.name ?? '');
  readonly availableTenants = computed(() => this.me.me()?.available_tenants ?? []);
  readonly currentTenantId = computed(() => this.me.me()?.tenant.id);
  readonly canSwitchTenant = computed(() => this.availableTenants().length > 1);

  protected readonly menuOpen = signal(false);
  protected readonly tenantMenuOpen = signal(false);
  protected readonly switching = signal(false);

  readonly nowLabel = computed(() => {
    const at = this.overview.lastFetchedAt();
    return at ? TIME_FORMAT.format(at) : '— actualizando…';
  });

  ngOnInit(): void {
    if (!this.isBrowser) return;
    this.me.ensureLoaded().catch(() => {/* 401 interceptor will redirect */});
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  toggleTenantMenu(): void {
    if (!this.canSwitchTenant()) return;
    this.tenantMenuOpen.update((v) => !v);
  }

  async pickTenant(tenantId: string): Promise<void> {
    if (this.switching() || tenantId === this.currentTenantId()) {
      this.tenantMenuOpen.set(false);
      return;
    }
    this.switching.set(true);
    this.tenantMenuOpen.set(false);
    try {
      await this.auth.switchTenant(tenantId);
      // Force a fresh page load — every page's signal cache is stale and
      // RLS-scoped data on the server now answers for the new tenant.
      window.location.href = '/';
    } catch {
      // 401 interceptor handles the bad-token case; nothing else to do.
    } finally {
      this.switching.set(false);
    }
  }

  logout(): void {
    this.menuOpen.set(false);
    this.tenantMenuOpen.set(false);
    this.me.reset();
    this.auth.logout();
  }
}
