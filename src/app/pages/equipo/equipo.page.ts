import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';

import { TeamService } from '../../core/api/team.service';
import { ApiTeamMember, ApiTeamResponse, TeamRole } from '../../core/api/types';

type Filter = TeamRole | 'all';

const ROLE_LABELS: Record<TeamRole, string> = {
  admin:  'Admin',
  agent:  'Agente',
  viewer: 'Lector',
};

const ROLE_DESCRIPTIONS: Record<TeamRole, string> = {
  admin:  'Control total: ajustes, equipo, módulos, facturación.',
  agent:  'Trabaja el inbox y responde conversaciones.',
  viewer: 'Sólo lectura — dashboards e insights, sin acciones.',
};

const TIME_FORMAT = new Intl.RelativeTimeFormat('es-BO', { numeric: 'auto' });
const DATE_FORMAT = new Intl.DateTimeFormat('es-BO', {
  day: 'numeric', month: 'short', year: 'numeric',
  timeZone: 'America/La_Paz',
});

@Component({
  selector: 'app-equipo-page',
  imports: [],
  templateUrl: './equipo.page.html',
  styleUrl: './equipo.page.scss',
})
export class EquipoPage implements OnInit {
  private readonly service = inject(TeamService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly data = signal<ApiTeamResponse | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly filter = signal<Filter>('all');

  protected readonly filterOptions = computed<{ key: Filter; label: string; count: number }[]>(() => {
    const d = this.data();
    if (!d) return [];
    const c = d.count_by_role;
    return [
      { key: 'all',    label: 'Todos',   count: d.total },
      { key: 'admin',  label: 'Admins',  count: c.admin  ?? 0 },
      { key: 'agent',  label: 'Agentes', count: c.agent  ?? 0 },
      { key: 'viewer', label: 'Lectores', count: c.viewer ?? 0 },
    ];
  });

  protected readonly filteredMembers = computed<ApiTeamMember[]>(() => {
    const all = this.data()?.members ?? [];
    const f = this.filter();
    return f === 'all' ? all : all.filter((m) => m.role === f);
  });

  async ngOnInit(): Promise<void> {
    if (!this.isBrowser) return;
    try {
      this.data.set(await this.service.list());
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    }
  }

  setFilter(f: Filter): void {
    this.filter.set(f);
  }

  roleLabel(r: TeamRole): string { return ROLE_LABELS[r]; }
  roleDescription(r: TeamRole): string { return ROLE_DESCRIPTIONS[r]; }

  formatJoinedAt(iso: string): string {
    return DATE_FORMAT.format(new Date(iso));
  }

  formatLastLogin(iso: string | undefined): string {
    if (!iso) return 'nunca';
    const then = new Date(iso).getTime();
    const diffMin = Math.round((then - Date.now()) / 60000);
    if (Math.abs(diffMin) < 60) return TIME_FORMAT.format(diffMin, 'minute');
    const diffHr = Math.round(diffMin / 60);
    if (Math.abs(diffHr) < 48) return TIME_FORMAT.format(diffHr, 'hour');
    return TIME_FORMAT.format(Math.round(diffHr / 24), 'day');
  }
}
