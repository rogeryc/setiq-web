import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  ApiTrackedSubject,
  ApiTrackedSubjectCreate,
  ApiTrackedSubjectUpdate,
  SubjectKind,
} from '../../core/api/types';
import { TrackedSubjectsService } from '../../core/api/tracked-subjects.service';

const KIND_OPTIONS: { key: SubjectKind; label: string; hint: string }[] = [
  { key: 'brand',      label: 'Marca propia', hint: 'Tu cuenta o tu nombre comercial.' },
  { key: 'competitor', label: 'Competidor',   hint: 'Una cuenta que querés monitorear.' },
  { key: 'keyword',    label: 'Tema',         hint: 'Términos que aparecen en posts/comentarios.' },
  { key: 'hashtag',    label: 'Hashtag',      hint: 'Etiquetas seguidas en redes.' },
];

const PLATFORM_KEYS = ['instagram', 'facebook', 'tiktok', 'twitter'] as const;

@Component({
  selector: 'app-subject-editor-modal',
  imports: [FormsModule],
  templateUrl: './subject-editor-modal.html',
  styleUrl: './subject-editor-modal.scss',
  encapsulation: ViewEncapsulation.None,
})
export class SubjectEditorModalComponent implements OnInit {
  private readonly service = inject(TrackedSubjectsService);

  @Input() mode: 'create' | 'edit' = 'create';
  @Input() initial: ApiTrackedSubject | null = null;
  @Output() saved = new EventEmitter<ApiTrackedSubject>();
  @Output() closed = new EventEmitter<void>();

  protected readonly kindOptions = KIND_OPTIONS;
  protected readonly platformKeys = PLATFORM_KEYS;

  protected readonly kind = signal<SubjectKind>('competitor');
  protected readonly label = signal('');
  protected readonly handles = signal<Record<string, string>>({});
  protected readonly keywordsInput = signal('');
  protected readonly hashtagsInput = signal('');
  protected readonly enabled = signal(true);

  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    if (this.mode === 'edit' && this.initial) {
      const s = this.initial;
      this.kind.set(s.kind);
      this.label.set(s.label);
      this.handles.set({ ...s.handles });
      this.keywordsInput.set(s.keywords.join(', '));
      this.hashtagsInput.set(s.hashtags.join(', '));
      this.enabled.set(s.enabled);
    }
  }

  handleValue(platform: string): string {
    return this.handles()[platform] ?? '';
  }

  setHandle(platform: string, value: string): void {
    this.handles.update((h) => {
      const next = { ...h };
      const trimmed = value.trim();
      if (trimmed) next[platform] = trimmed;
      else delete next[platform];
      return next;
    });
  }

  protected readonly isLabelValid = () => this.label().trim().length > 0;

  /** Show fields only relevant to the active kind to keep the form short. */
  showHandles(): boolean {
    const k = this.kind();
    return k === 'brand' || k === 'competitor';
  }
  showKeywords(): boolean {
    return this.kind() === 'keyword' || this.kind() === 'brand';
  }
  showHashtags(): boolean {
    return this.kind() === 'hashtag' || this.kind() === 'brand';
  }

  private parseList(raw: string): string[] {
    return raw.split(',').map((s) => s.trim().replace(/^#/, '')).filter(Boolean);
  }

  async save(): Promise<void> {
    if (this.submitting() || !this.isLabelValid()) return;
    this.error.set(null);
    this.submitting.set(true);
    try {
      const payload = {
        label: this.label().trim(),
        handles: this.showHandles() ? this.handles() : {},
        keywords: this.showKeywords() ? this.parseList(this.keywordsInput()) : [],
        hashtags: this.showHashtags() ? this.parseList(this.hashtagsInput()) : [],
        enabled: this.enabled(),
      };
      const result =
        this.mode === 'create'
          ? await this.service.create({ kind: this.kind(), ...payload } as ApiTrackedSubjectCreate)
          : await this.service.update(this.initial!.id, payload as ApiTrackedSubjectUpdate);
      this.saved.emit(result);
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'No pudimos guardar. Reintentá.');
    } finally {
      this.submitting.set(false);
    }
  }

  close(): void {
    if (!this.submitting()) this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) this.close();
  }
}
