import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { TrackedSubjectsService } from '../../core/api/tracked-subjects.service';
import { ApiTrackedSubject, ApiTrackedSubjectDetail, SubjectKind } from '../../core/api/types';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state';

type Filter = SubjectKind | 'all';

const LAST_MENTION_FORMAT = new Intl.RelativeTimeFormat('es-BO', { numeric: 'auto' });

@Component({
  selector: 'app-segmentos-page',
  imports: [FormsModule, EmptyStateComponent],
  templateUrl: './segmentos.page.html',
  styleUrl: './segmentos.page.scss',
})
export class SegmentosPage implements OnInit {
  private readonly service = inject(TrackedSubjectsService);
  private readonly route = inject(ActivatedRoute);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly data = signal<ApiTrackedSubject[] | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly filter = signal<Filter>('all');
  /** Per-subject expand state (collapsed by default). Brand is always expanded
   * so it's not tracked here. */
  protected readonly expandedSubjects = signal<ReadonlySet<string>>(new Set());

  // ---- Filter counts + options ----
  protected readonly counts = computed(() => {
    const subjects = this.data() ?? [];
    const counts: Record<SubjectKind, number> = { brand: 0, competitor: 0, keyword: 0, hashtag: 0 };
    for (const s of subjects) counts[s.kind]++;
    return counts;
  });

  protected readonly filterOptions = computed<{ key: Filter; label: string; count: number }[]>(() => {
    const data = this.data() ?? [];
    const c = this.counts();
    return [
      { key: 'all',         label: 'Todos',        count: data.length },
      { key: 'brand',       label: 'Marca propia', count: c.brand },
      { key: 'competitor',  label: 'Competidores', count: c.competitor },
      { key: 'keyword',     label: 'Temas',        count: c.keyword },
      { key: 'hashtag',     label: 'Hashtags',     count: c.hashtag },
    ];
  });

  // ---- Priority tiers (visual grouping) ----
  private readonly filtered = computed<ApiTrackedSubject[]>(() => {
    const subjects = this.data() ?? [];
    const active = this.filter();
    return active === 'all' ? subjects : subjects.filter((s) => s.kind === active);
  });

  protected readonly tierBrand = computed(() =>
    this.filtered().filter((s) => s.kind === 'brand'),
  );

  protected readonly tierCompetitors = computed(() =>
    this.filtered().filter((s) => s.kind === 'competitor'),
  );

  /** Keywords + hashtags share the "signals" tier — same visual treatment,
   * same low-priority context role. Kind is preserved on each row for chip color. */
  protected readonly tierSignals = computed(() =>
    this.filtered().filter((s) => s.kind === 'keyword' || s.kind === 'hashtag'),
  );

  protected readonly totalMentions = computed(() =>
    (this.data() ?? []).reduce((sum, s) => sum + (s.mention_count || 0), 0),
  );

  protected readonly enabledCount = computed(() =>
    (this.data() ?? []).filter((s) => s.enabled).length,
  );

  async ngOnInit(): Promise<void> {
    if (!this.isBrowser) return;
    await this.reload();
  }

  async reload(): Promise<void> {
    this.error.set(null);
    try {
      const list = await this.service.list();
      this.data.set(list);
      const subjectId = this.route.snapshot.queryParamMap.get('subject');
      if (subjectId) {
        const match = list.find((s) => s.id === subjectId);
        if (match) await this.openDetail(match);
      }
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    }
  }

  setFilter(f: Filter): void {
    this.filter.set(f);
  }

  toggleSubject(id: string): void {
    this.expandedSubjects.update((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  isSubjectExpanded(id: string): boolean {
    return this.expandedSubjects().has(id);
  }

  formatLastMention(iso: string | undefined): string {
    if (!iso) return 'sin actividad';
    const then = new Date(iso).getTime();
    const diffMin = Math.round((then - Date.now()) / 60000);
    if (Math.abs(diffMin) < 60) return LAST_MENTION_FORMAT.format(diffMin, 'minute');
    const diffHr = Math.round(diffMin / 60);
    if (Math.abs(diffHr) < 48) return LAST_MENTION_FORMAT.format(diffHr, 'hour');
    return LAST_MENTION_FORMAT.format(Math.round(diffHr / 24), 'day');
  }

  handleEntries(handles: Record<string, string>): Array<[string, string]> {
    return Object.entries(handles);
  }

  chipCountSummary(s: ApiTrackedSubject): string {
    const parts: string[] = [];
    const h = this.handleEntries(s.handles).length;
    if (h) parts.push(`${h} ${h === 1 ? 'handle' : 'handles'}`);
    if (s.keywords.length) parts.push(`${s.keywords.length} kw`);
    if (s.hashtags.length) parts.push(`${s.hashtags.length} tag`);
    return parts.join(' · ') || 'sin señales';
  }

  // ---- Add / edit modal ----

  protected readonly showModal = signal(false);
  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly editingId = signal<string | null>(null);
  protected readonly busyId = signal<string | null>(null);

  protected readonly fKind = signal<SubjectKind>('competitor');
  protected readonly fLabel = signal('');
  protected readonly fInstagram = signal('');
  protected readonly fTiktok = signal('');
  protected readonly fFacebook = signal('');
  protected readonly fKeywords = signal('');
  protected readonly fHashtags = signal('');

  private resetForm(): void {
    this.formError.set(null);
    this.fKind.set('competitor');
    this.fLabel.set('');
    this.fInstagram.set('');
    this.fTiktok.set('');
    this.fFacebook.set('');
    this.fKeywords.set('');
    this.fHashtags.set('');
  }

  openModal(kind?: SubjectKind): void {
    this.editingId.set(null);
    this.resetForm();
    if (kind) this.fKind.set(kind);
    this.showModal.set(true);
  }

  openEdit(s: ApiTrackedSubject): void {
    this.editingId.set(s.id);
    this.formError.set(null);
    this.fKind.set(s.kind);
    this.fLabel.set(s.label);
    this.fInstagram.set(s.handles['instagram'] ?? '');
    this.fTiktok.set(s.handles['tiktok'] ?? '');
    this.fFacebook.set(s.handles['facebook'] ?? '');
    this.fKeywords.set(s.keywords.join(', '));
    this.fHashtags.set(s.hashtags.join(', '));
    this.showModal.set(true);
  }

  closeModal(): void {
    if (!this.submitting()) this.showModal.set(false);
  }

  private splitList(value: string): string[] {
    return value.split(',').map((s) => s.trim()).filter(Boolean);
  }

  async submit(): Promise<void> {
    if (this.submitting()) return;
    const label = this.fLabel().trim();
    if (!label) {
      this.formError.set('El nombre es obligatorio.');
      return;
    }
    const handles: Record<string, string> = {};
    if (this.fInstagram().trim()) handles['instagram'] = this.fInstagram().trim();
    if (this.fTiktok().trim()) handles['tiktok'] = this.fTiktok().trim();
    if (this.fFacebook().trim()) handles['facebook'] = this.fFacebook().trim();
    const keywords = this.splitList(this.fKeywords());
    const hashtags = this.splitList(this.fHashtags());

    this.submitting.set(true);
    this.formError.set(null);
    try {
      const id = this.editingId();
      if (id) {
        const updated = await this.service.update(id, { label, handles, keywords, hashtags });
        this.data.update((list) =>
          (list ?? []).map((s) =>
            s.id === id
              ? { ...updated, mention_count: s.mention_count, last_mention_at: s.last_mention_at }
              : s,
          ),
        );
      } else {
        const created = await this.service.create({
          kind: this.fKind(), label, handles, keywords, hashtags, enabled: true,
        });
        this.data.update((list) => [created, ...(list ?? [])]);
      }
      this.showModal.set(false);
    } catch (e) {
      this.formError.set(e instanceof Error ? e.message : 'No se pudo guardar el sujeto.');
    } finally {
      this.submitting.set(false);
    }
  }

  async togglePause(s: ApiTrackedSubject): Promise<void> {
    if (this.busyId()) return;
    this.busyId.set(s.id);
    try {
      const updated = await this.service.update(s.id, { enabled: !s.enabled });
      this.data.update((list) =>
        (list ?? []).map((x) =>
          x.id === s.id
            ? { ...updated, mention_count: x.mention_count, last_mention_at: x.last_mention_at }
            : x,
        ),
      );
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.busyId.set(null);
    }
  }

  async deleteSubject(s: ApiTrackedSubject): Promise<void> {
    if (this.busyId()) return;
    if (this.isBrowser && !confirm(`¿Eliminar "${s.label}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    this.busyId.set(s.id);
    try {
      await this.service.remove(s.id);
      this.data.update((list) => (list ?? []).filter((x) => x.id !== s.id));
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.busyId.set(null);
    }
  }

  // ---- Detail drawer (unchanged) ----

  protected readonly showDetail = signal(false);
  protected readonly detailLoading = signal(false);
  protected readonly detail = signal<ApiTrackedSubjectDetail | null>(null);
  protected readonly detailError = signal<string | null>(null);

  async openDetail(s: ApiTrackedSubject): Promise<void> {
    this.showDetail.set(true);
    this.detail.set(null);
    this.detailError.set(null);
    this.detailLoading.set(true);
    try {
      this.detail.set(await this.service.detail(s.id));
    } catch (e) {
      this.detailError.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.detailLoading.set(false);
    }
  }

  closeDetail(): void {
    this.showDetail.set(false);
  }

  sentimentPct(detail: ApiTrackedSubjectDetail, key: 'positive' | 'neutral' | 'negative'): number {
    const b = detail.sentiment_breakdown;
    const total = b.positive + b.neutral + b.negative;
    return total > 0 ? Math.round((b[key] / total) * 100) : 0;
  }
}
