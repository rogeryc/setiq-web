import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  route: string;
  exact?: boolean;
}

@Component({
  selector: 'app-nav-tabs',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav-tabs.html',
})
export class NavTabsComponent {
  readonly items: NavItem[] = [
    { label: 'Resumen', route: '/', exact: true },
    { label: 'Recomendaciones', route: '/recomendaciones' },
    { label: 'Segmentos', route: '/segmentos' },
    { label: 'Inbox', route: '/inbox' },
    { label: 'Canales', route: '/canales' },
    { label: 'Equipo', route: '/equipo' },
    { label: 'Ajustes', route: '/ajustes' },
  ];

  readonly activeModule = 'Kaizen';
}
