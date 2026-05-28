import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

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
  imports: [FormsModule],
  templateUrl: './segmentos.page.html',
  styleUrl: './segmentos.page.scss',
})
export class SegmentosPage implements OnInit {
  private readonly service = inject(TrackedSubjectsService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly data = signal<ApiTrackedSubject[] | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly filter = signal<Filter>('all');

  /** Counts per kind for the filter pills. */
  protected readonly counts = computed(() => {
    const subjects = this.data() ?? [];
    const counts: Record<SubjectKind, number> = {
      brand: 0, competitor: 0, keyword: 0, hashtag: 0,
    };
    for (const s of subjects) counts[s.kind]++;
    return counts;
  });

  /** Filter chip definitions in display order. */
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

  openModal(): void {
    this.editingId.set(null);
    this.resetForm();
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
          kind: this.fKind(),
          label,
          handles,
          keywords,
          hashtags,
          enabled: true,
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
}
