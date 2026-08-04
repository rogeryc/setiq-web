import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { InsightsService } from '../../core/api/insights.service';
import { TeamService } from '../../core/api/team.service';
import { ApiInsight, ApiInsightAction, ApiInsightsResponse, ApiTeamMember } from '../../core/api/types';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state';

type ContextCat = 'audiencia' | 'temas' | 'pares';
type Filter = 'todas' | ContextCat;

interface ContextRow {
  id: string;
  cat: ContextCat;
  tag: string;
  text: string;
  when: string;
  // Everything below is progressive-disclosure — only shown when the row is expanded.
  body: string;
  confidence?: string;
  footnote?: string;
  actions: ApiInsightAction[];
}

@Component({
  selector: 'app-recomendaciones-page',
  imports: [EmptyStateComponent, RouterLink],
  templateUrl: './recomendaciones.page.html',
  styleUrl: './recomendaciones.page.scss',
})
export class RecomendacionesPage implements OnInit {
  private readonly service = inject(InsightsService);
  private readonly teamService = inject(TeamService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly data = signal<ApiInsightsResponse | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly filter = signal<Filter>('todas');
  protected readonly expanded = signal(false);
  protected readonly heroDismissed = signal(false);
  protected readonly heroDetailOpen = signal(false);
  /** Per-card inline expand state — hero + week + context all use the same
   * Set keyed by insight id. */
  protected readonly expandedCards = signal<ReadonlySet<string>>(new Set());
  /** Per-context-row expand state (kept separate from cards for clarity). */
  protected readonly expandedRows = signal<ReadonlySet<string>>(new Set());

  // ---- Assignment modal ----
  protected readonly assignFor = signal<ApiInsight | null>(null);
  protected readonly teamMembers = signal<ApiTeamMember[]>([]);
  protected readonly assignSubmitting = signal(false);
  protected readonly assignError = signal<string | null>(null);
  protected readonly assignSelected = signal<string | null>(null);

  /** The single most urgent recommendation — pinned to the top hero. */
  protected readonly hero = computed<ApiInsight | null>(() => {
    const all = this.data()?.insights ?? [];
    return all.find((i) => i.kind === 'featured' && i.severity === 'high')
        ?? all.find((i) => i.kind === 'featured')
        ?? null;
  });

  /** Remaining featured recs — the "this week" tier. Max 2 cards. */
  protected readonly weekCards = computed<ApiInsight[]>(() => {
    const hero = this.hero();
    const featured = (this.data()?.insights ?? []).filter((i) => i.kind === 'featured');
    return featured.filter((i) => i.id !== hero?.id).slice(0, 2);
  });

  /** All context memos, one row each — with derived category for filtering. */
  protected readonly allContext = computed<ContextRow[]>(() => {
    return (this.data()?.insights ?? [])
      .filter((i) => i.kind === 'memo')
      .map((m) => this.toContextRow(m));
  });

  protected readonly filteredContext = computed<ContextRow[]>(() => {
    const f = this.filter();
    const rows = this.allContext();
    return f === 'todas' ? rows : rows.filter((r) => r.cat === f);
  });

  protected readonly visibleContext = computed<ContextRow[]>(() => {
    return this.expanded() ? this.filteredContext() : this.filteredContext().slice(0, 5);
  });

  protected readonly hiddenCount = computed(
    () => this.filteredContext().length - this.visibleContext().length,
  );

  protected readonly totalCount = computed(() => this.data()?.total ?? 0);

  protected readonly filterOptions = computed<{ key: Filter; label: string }[]>(() => [
    { key: 'todas',     label: 'Todas · ' + this.allContext().length },
    { key: 'audiencia', label: 'Tu audiencia' },
    { key: 'temas',     label: 'Tus temas' },
    { key: 'pares',     label: 'Tus pares' },
  ]);

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
    this.expanded.set(false); // reset collapse when filter changes
  }

  toggleExpanded(): void {
    this.expanded.update((v) => !v);
  }

  toggleRow(id: string): void {
    this.expandedRows.update((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  isRowExpanded(id: string): boolean {
    return this.expandedRows().has(id);
  }

  toggleCard(id: string): void {
    this.expandedCards.update((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  isCardExpanded(id: string): boolean {
    return this.expandedCards().has(id);
  }

  toggleHeroDetail(): void {
    this.heroDetailOpen.update((v) => !v);
  }

  dismissHero(): void {
    this.heroDismissed.set(true);
  }

  restoreHero(): void {
    this.heroDismissed.set(false);
  }

  /** Turn a memo insight into a compact context row. */
  private toContextRow(m: ApiInsight): ContextRow {
    const cat = this.deriveCategory(m);
    return {
      id: m.id,
      cat,
      tag: this.tagLabel(cat),
      text: m.title,
      when: m.age || this.relativeCreated(m.created_at),
      body: m.body,
      confidence: m.confidence,
      footnote: m.footnote,
      actions: m.actions,
    };
  }

  /**
   * Map the free-form insight.tag into one of the three context categories.
   * Falls back to 'temas' when nothing matches (safest bucket — topic-adjacent).
   * When Phase 2 lands a real `category` column on the backend, this becomes
   * `m.category ?? deriveCategory(m)`.
   */
  private deriveCategory(m: ApiInsight): ContextCat {
    const t = (m.tag || '').toLowerCase();
    if (t.includes('audien')) return 'audiencia';
    if (t.includes('par') || t.includes('competi') || t.includes('rival')) return 'pares';
    return 'temas';
  }

  private tagLabel(c: ContextCat): string {
    return c === 'audiencia' ? 'AUDIENCIA' : c === 'pares' ? 'PARES' : 'TEMA';
  }

  private relativeCreated(iso: string): string {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const h = Math.round((now - then) / 3_600_000);
    if (h < 1) return 'hace un rato';
    if (h < 24) return `hace ${h} h`;
    const d = Math.round(h / 24);
    return d === 1 ? 'ayer' : `hace ${d} días`;
  }

  /** First action = primary CTA on hero/cards; rest are secondary. */
  primaryAction(a: ApiInsightAction[]): ApiInsightAction | null {
    return a[0] ?? null;
  }

  secondaryAction(a: ApiInsightAction[]): ApiInsightAction | null {
    return a[1] ?? null;
  }

  /** Detect the placeholder "Asignar a X" action so the button can trigger the
   * modal instead of a dead click. Label-based rather than route-based because
   * the seed data ships it with no route. */
  isAssignAction(a: ApiInsightAction | null | undefined): boolean {
    return !!a && !a.route && /^asignar\b/i.test(a.label);
  }

  // ---- Assignment modal actions ----

  async openAssignFor(insight: ApiInsight): Promise<void> {
    this.assignFor.set(insight);
    this.assignError.set(null);
    this.assignSelected.set(insight.assigned_user_id ?? null);
    if (this.teamMembers().length === 0) {
      try {
        const t = await this.teamService.list();
        this.teamMembers.set(t.members);
      } catch (e) {
        this.assignError.set(e instanceof Error ? e.message : String(e));
      }
    }
  }

  closeAssign(): void {
    if (this.assignSubmitting()) return;
    this.assignFor.set(null);
    this.assignError.set(null);
    this.assignSelected.set(null);
  }

  pickAssignee(userId: string | null): void {
    this.assignSelected.set(userId);
  }

  async submitAssignment(): Promise<void> {
    const target = this.assignFor();
    if (!target) return;
    this.assignSubmitting.set(true);
    this.assignError.set(null);
    try {
      const res = await this.service.assign(target.id, this.assignSelected());
      // Patch the local insight list so the change reflects immediately without
      // re-fetching. Any card that renders `assigned_user_name` picks it up.
      this.data.update((d) => d && ({
        ...d,
        insights: d.insights.map((i) => i.id === target.id
          ? { ...i, assigned_user_id: res.assigned_user_id, assigned_user_name: res.assigned_user_name }
          : i),
      }));
      this.assignFor.set(null);
    } catch (e) {
      const err = e as { error?: { detail?: string }; message?: string };
      this.assignError.set(err.error?.detail ?? err.message ?? 'No pudimos asignar.');
    } finally {
      this.assignSubmitting.set(false);
    }
  }
}
