import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { TeamService } from '../../core/api/team.service';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state';
import { ApiInviteResponse, ApiTeamMember, ApiTeamResponse, TeamRole } from '../../core/api/types';

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
  imports: [FormsModule, EmptyStateComponent],
  templateUrl: './equipo.page.html',
  styleUrl: './equipo.page.scss',
})
export class EquipoPage implements OnInit {
  private readonly service = inject(TeamService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly data = signal<ApiTeamResponse | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly filter = signal<Filter>('all');

  // --- Invite modal state ---
  protected readonly inviteOpen = signal(false);
  protected readonly inviteSubmitting = signal(false);
  protected readonly inviteError = signal<string | null>(null);
  protected readonly inviteEmail = signal('');
  protected readonly inviteName = signal('');
  protected readonly inviteRole = signal<TeamRole>('agent');

  /** Last invite result — drives the credentials banner. Cleared by dismiss. */
  protected readonly lastInvite = signal<ApiInviteResponse | null>(null);
  protected readonly passwordCopied = signal(false);

  protected readonly roleOptions: { key: TeamRole; label: string }[] = [
    { key: 'admin',  label: 'Admin' },
    { key: 'agent',  label: 'Agente' },
    { key: 'viewer', label: 'Lector' },
  ];

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
    await this.reload();
  }

  async reload(): Promise<void> {
    this.error.set(null);
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

  // --- Invite flow -----------------------------------------------------

  openInvite(): void {
    this.inviteError.set(null);
    this.inviteEmail.set('');
    this.inviteName.set('');
    this.inviteRole.set('agent');
    this.inviteOpen.set(true);
  }

  closeInvite(): void {
    if (!this.inviteSubmitting()) this.inviteOpen.set(false);
  }

  async submitInvite(): Promise<void> {
    if (this.inviteSubmitting()) return;
    const email = this.inviteEmail().trim();
    if (!email || !email.includes('@')) {
      this.inviteError.set('Ingresá un email válido.');
      return;
    }
    this.inviteSubmitting.set(true);
    this.inviteError.set(null);
    try {
      const result = await this.service.invite({
        email,
        name: this.inviteName().trim() || undefined,
        role: this.inviteRole(),
      });
      this.lastInvite.set(result);
      this.passwordCopied.set(false);

      // Refresh the list — handles both create-new and role-flip cases.
      this.data.update((curr) => {
        if (!curr) return curr;
        const exists = curr.members.some((m) => m.id === result.member.id);
        const members = exists
          ? curr.members.map((m) => (m.id === result.member.id ? result.member : m))
          : [result.member, ...curr.members];
        const count_by_role: Record<TeamRole, number> = { admin: 0, agent: 0, viewer: 0 };
        for (const m of members) count_by_role[m.role]++;
        return { members, count_by_role, total: members.length };
      });

      this.inviteOpen.set(false);
    } catch (e: unknown) {
      const status = (e as { status?: number })?.status;
      this.inviteError.set(
        status === 403 ? 'Sólo los admins pueden invitar.' :
        status === 422 ? 'Datos inválidos. Revisá email + rol.' :
        'No pudimos invitar a esa persona. Reintentá.'
      );
    } finally {
      this.inviteSubmitting.set(false);
    }
  }

  async copyPassword(): Promise<void> {
    const pwd = this.lastInvite()?.temp_password;
    if (!pwd) return;
    try {
      await navigator.clipboard.writeText(pwd);
      this.passwordCopied.set(true);
      setTimeout(() => this.passwordCopied.set(false), 2000);
    } catch {
      // Browser blocked clipboard (e.g. http origin); user can select manually.
    }
  }

  dismissLastInvite(): void {
    this.lastInvite.set(null);
  }
}
