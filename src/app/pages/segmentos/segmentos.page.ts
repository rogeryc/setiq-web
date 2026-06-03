import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';

import { SubjectEditorModalComponent } from '../../shared/subject-editor-modal/subject-editor-modal';
import { TrackedSubjectsService } from '../../core/api/tracked-subjects.service';
import { ApiTrackedSubject, SubjectKind } from '../../core/api/types';

interface KindSection {
  kind: SubjectKind;
  label: string;
  description: string;
  subjects: ApiTrackedSubject[];
}

const KIND_META: Record<SubjectKind, { label: string; description: string; order: number }> = {
  brand: {
    label: 'Marca propia',
    description: 'Palabras y hashtags que identifican a Thalma.',
    order: 0,
  },
  competitor: {
    label: 'Competidores',
    description: 'Cuentas que se monitorean para benchmark + share-of-voice.',
    order: 1,
  },
  keyword: {
    label: 'Temas (keywords)',
    description: 'Términos que Thalma sigue para detectar tendencias.',
    order: 2,
  },
  hashtag: {
    label: 'Hashtags',
    description: 'Etiquetas seguidas en redes (Instagram, TikTok, X).',
    order: 3,
  },
};

const LAST_MENTION_FORMAT = new Intl.RelativeTimeFormat('es-BO', { numeric: 'auto' });

type Filter = SubjectKind | 'all';

@Component({
  selector: 'app-segmentos-page',
  imports: [SubjectEditorModalComponent],
  templateUrl: './segmentos.page.html',
  styleUrl: './segmentos.page.scss',
})
export class SegmentosPage implements OnInit {
  private readonly service = inject(TrackedSubjectsService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly data = signal<ApiTrackedSubject[] | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly filter = signal<Filter>('all');

  /** Modal + per-card menu state. */
  protected readonly modal = signal<{ mode: 'create' | 'edit'; initial: ApiTrackedSubject | null } | null>(null);
  protected readonly openMenuId = signal<string | null>(null);
  protected readonly pendingId = signal<string | null>(null);
  protected readonly confirmDelete = signal<ApiTrackedSubject | null>(null);

  protected readonly counts = computed(() => {
    const subjects = this.data() ?? [];
    const counts: Record<SubjectKind, number> = {
      brand: 0, competitor: 0, keyword: 0, hashtag: 0,
    };
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

  protected readonly sections = computed<KindSection[]>(() => {
    const subjects = this.data() ?? [];
    const active = this.filter();
    const buckets: Record<SubjectKind, ApiTrackedSubject[]> = {
      brand: [], competitor: [], keyword: [], hashtag: [],
    };
    for (const s of subjects) {
      if (active === 'all' || s.kind === active) buckets[s.kind].push(s);
    }

    return (Object.keys(buckets) as SubjectKind[])
      .filter((k) => buckets[k].length > 0)
      .sort((a, b) => KIND_META[a].order - KIND_META[b].order)
      .map((k) => ({
        kind: k,
        label: KIND_META[k].label,
        description: KIND_META[k].description,
        subjects: buckets[k],
      }));
  });

  setFilter(f: Filter): void {
    this.filter.set(f);
  }

  protected readonly totalMentions = computed(() =>
    (this.data() ?? []).reduce((sum, s) => sum + (s.mention_count || 0), 0),
  );

  protected readonly enabledCount = computed(() =>
    (this.data() ?? []).filter((s) => s.enabled).length,
  );

  async ngOnInit(): Promise<void> {
    if (!this.isBrowser) return;
    try {
      this.data.set(await this.service.list());
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    }
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

  // ------------------------------------------------------------------
  // Mutations
  // ------------------------------------------------------------------

  openCreate(): void {
    this.modal.set({ mode: 'create', initial: null });
  }

  openEdit(s: ApiTrackedSubject): void {
    this.openMenuId.set(null);
    this.modal.set({ mode: 'edit', initial: s });
  }

  closeModal(): void {
    this.modal.set(null);
  }

  onSaved(s: ApiTrackedSubject): void {
    const mode = this.modal()?.mode;
    this.closeModal();
    this.data.update((curr) => {
      if (!curr) return [s];
      if (mode === 'create') return [s, ...curr];
      return curr.map((x) => (x.id === s.id ? s : x));
    });
  }

  toggleMenu(id: string): void {
    this.openMenuId.update((curr) => (curr === id ? null : id));
  }

  async togglePause(s: ApiTrackedSubject): Promise<void> {
    if (this.pendingId() === s.id) return;
    this.openMenuId.set(null);
    this.pendingId.set(s.id);
    try {
      const updated = await this.service.update(s.id, { enabled: !s.enabled });
      this.data.update((curr) => curr?.map((x) => (x.id === s.id ? updated : x)) ?? null);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.pendingId.set(null);
    }
  }

  askDelete(s: ApiTrackedSubject): void {
    this.openMenuId.set(null);
    this.confirmDelete.set(s);
  }

  cancelDelete(): void {
    this.confirmDelete.set(null);
  }

  async confirmDeleteNow(): Promise<void> {
    const s = this.confirmDelete();
    if (!s || this.pendingId() === s.id) return;
    this.pendingId.set(s.id);
    try {
      await this.service.remove(s.id);
      this.data.update((curr) => curr?.filter((x) => x.id !== s.id) ?? null);
      this.confirmDelete.set(null);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.pendingId.set(null);
    }
  }
}
