import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ThemeService } from '../core/theme.service';
import { MastheadComponent } from './masthead/masthead';
import { NavTabsComponent } from './nav-tabs/nav-tabs';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, MastheadComponent, NavTabsComponent],
  templateUrl: './layout.html',
  styles: [':host { display: contents; }'],
})
export class LayoutComponent {
  readonly theme = inject(ThemeService);
}
