import { Component, input } from '@angular/core';

import { IconName } from './icon-set';

/**
 * <app-icon name="search" size="16" />
 *
 * 24×24 inline SVG. Color follows `currentColor`. We use @switch over
 * the icon name so each shape is a real child element of the <svg>,
 * which keeps the SSR DOM emulator happy (setting innerHTML on SVG is
 * not supported during SSR — see icon-set.ts comment).
 */
@Component({
  selector: 'app-icon',
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      [attr.aria-hidden]="ariaLabel() ? null : true"
      [attr.aria-label]="ariaLabel()"
    >
      @switch (name()) {
        @case ('search') {
          <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.5"/>
          <path d="m16 16 4.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        }
        @case ('chevron-down') {
          <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        }
        @case ('star') {
          <path d="M12 3l2.1 5.4 5.9.4-4.5 3.9 1.4 5.8L12 15.7 7.1 18.5 8.5 12.7 4 8.8l5.9-.4z" fill="currentColor"/>
        }
        @case ('theme') {
          <path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z" fill="currentColor"/>
        }
        @case ('arrow-up') {
          <path d="M12 5v14M5 12l7-7 7 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        }
        @case ('arrow-down') {
          <path d="M12 5v14M5 12l7 7 7-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        }
        @case ('check') {
          <path d="m5 12 4.5 4.5L19 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        }
        @case ('x') {
          <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        }
        @case ('instagram') {
          <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.6"/>
          <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.6"/>
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>
        }
        @case ('facebook') {
          <path d="M14 9V7.5A1.5 1.5 0 0 1 15.5 6H17V3h-2.5A4.5 4.5 0 0 0 10 7.5V9H7v3h3v9h4v-9h2.5l.5-3z" fill="currentColor"/>
        }
        @case ('tiktok') {
          <path d="M16 3v3a4 4 0 0 0 4 4v3a7 7 0 0 1-4-1.3V16a5 5 0 1 1-5-5v3a2 2 0 1 0 2 2V3z" fill="currentColor"/>
        }
        @case ('email') {
          <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/>
          <path d="m3 7 9 7 9-7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        }
      }
    </svg>
  `,
  styles: [`
    :host { display: inline-flex; line-height: 0; }
    svg { display: block; }
  `],
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input(16);
  readonly ariaLabel = input<string>();
}
