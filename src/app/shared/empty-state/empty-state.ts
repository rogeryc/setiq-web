import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';

/**
 * Standard non-content state shown in place of a page's data area.
 *
 * - `loading` → spinner-ish copy ("Cargando…").
 * - `empty`   → "Nothing here yet" — pass `message` + optional `hint`.
 * - `error`   → red border + the error text + optional retry button.
 *
 * Drop-in for places that previously used custom `.s-empty` divs so all
 * pages look and behave the same when there's no data.
 */
@Component({
  selector: 'app-empty-state',
  imports: [],
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
  encapsulation: ViewEncapsulation.None,
})
export class EmptyStateComponent {
  @Input({ required: true }) state!: 'loading' | 'empty' | 'error';
  @Input() message?: string;
  @Input() hint?: string;
  @Input() errorText?: string | null;
  @Input() actionLabel?: string;
  @Output() action = new EventEmitter<void>();

  protected defaultMessage(): string {
    switch (this.state) {
      case 'loading': return 'Cargando…';
      case 'empty':   return 'Sin datos por ahora.';
      case 'error':   return 'No pudimos cargar este contenido.';
    }
  }
}
