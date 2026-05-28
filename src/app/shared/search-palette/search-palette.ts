import { Component, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { SearchService } from '../../core/api/search.service';
import { ApiSearchHit } from '../../core/api/types';

const TYPE_LABEL: Record<ApiSearchHit['type'], string> = {
  contact: 'Contacto',
  tracked_subject: 'Segmento',
  conversation: 'Conversación',
};

const TYPE_ROUTE: Record<ApiSearchHit['type'], string> = {
  contact: '/inbox',
  tracked_subject: '/segmentos',
  conversation: '/inbox',
};

@Component({
  selector: 'app-search-palette',
  imports: [FormsModule],
  template: `
    @if (isOpen()) {
      <div class="sp-backdrop" (click)="close()">
        <div class="sp-panel" (click)="$event.stopPropagation()">
          <input #searchInput type="text" class="sp-input"
                 placeholder="Buscar conversaciones, contactos, segmentos…"
                 [ngModel]="query()" (ngModelChange)="onQuery($event)" />
          <div class="sp-results">
            @if (loading()) {
              <p class="sp-empty">Buscando…</p>
            } @else if (query().trim().length === 0) {
              <p class="sp-empty">Escribí para buscar.</p>
            } @else if (results().length === 0) {
              <p class="sp-empty">Sin resultados para "{{ query() }}".</p>
            } @else {
              @for (h of results(); track h.type + h.id) {
                <button type="button" class="sp-hit" (click)="go(h)">
                  <span class="sp-hit-title">{{ h.title }}</span>
                  @if (h.subtitle) { <span class="sp-hit-sub">{{ h.subtitle }}</span> }
                  <span class="sp-hit-type">{{ typeLabel(h.type) }}</span>
                </button>
              }
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .sp-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding-top: 12vh;
      z-index: 200;
    }
    .sp-panel {
      width: 100%;
      max-width: 560px;
      background: var(--card);
      border: 1px solid var(--rule-strong);
      border-radius: 12px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
      overflow: hidden;
    }
    .sp-input {
      width: 100%;
      border: none;
      border-bottom: 1px solid var(--rule);
      background: transparent;
      padding: 16px 18px;
      font-size: 15px;
      font-family: inherit;
      color: var(--ink);
      &:focus { outline: none; }
    }
    .sp-results { max-height: 50vh; overflow-y: auto; padding: 6px; }
    .sp-empty { padding: 20px; text-align: center; color: var(--muted); font-size: 13px; margin: 0; }
    .sp-hit {
      width: 100%;
      display: flex;
      align-items: baseline;
      gap: 10px;
      background: none;
      border: none;
      border-radius: 8px;
      padding: 10px 12px;
      text-align: left;
      cursor: pointer;
      font-family: inherit;
      &:hover { background: var(--card-2); }
    }
    .sp-hit-title { font-size: 13.5px; color: var(--ink); font-weight: 500; }
    .sp-hit-sub { font-size: 12px; color: var(--muted); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .sp-hit-type {
      font-size: 10.5px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--muted);
      border: 1px solid var(--rule);
      border-radius: 5px;
      padding: 2px 6px;
      margin-left: auto;
      flex-shrink: 0;
    }
  `],
})
export class SearchPaletteComponent {
  private readonly service = inject(SearchService);
  private readonly router = inject(Router);
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  protected readonly isOpen = signal(false);
  protected readonly query = signal('');
  protected readonly results = signal<ApiSearchHit[]>([]);
  protected readonly loading = signal(false);

  private debounce: ReturnType<typeof setTimeout> | null = null;
  private seq = 0;

  open(): void {
    this.query.set('');
    this.results.set([]);
    this.isOpen.set(true);
    setTimeout(() => this.searchInput()?.nativeElement.focus(), 0);
  }

  close(): void {
    this.isOpen.set(false);
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      this.isOpen() ? this.close() : this.open();
    } else if (e.key === 'Escape' && this.isOpen()) {
      this.close();
    }
  }

  onQuery(value: string): void {
    this.query.set(value);
    if (this.debounce) clearTimeout(this.debounce);
    const term = value.trim();
    if (!term) {
      this.results.set([]);
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.debounce = setTimeout(() => this.run(term), 250);
  }

  private async run(term: string): Promise<void> {
    const mine = ++this.seq;
    try {
      const resp = await this.service.search(term);
      if (mine !== this.seq) return;
      this.results.set(resp.hits);
    } catch {
      if (mine === this.seq) this.results.set([]);
    } finally {
      if (mine === this.seq) this.loading.set(false);
    }
  }

  typeLabel(t: ApiSearchHit['type']): string {
    return TYPE_LABEL[t];
  }

  go(h: ApiSearchHit): void {
    this.close();
    this.router.navigateByUrl(TYPE_ROUTE[h.type]);
  }
}
