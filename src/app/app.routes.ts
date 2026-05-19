import { Routes } from '@angular/router';

import { LayoutComponent } from './layout/layout';
import { OverviewPage } from './pages/overview/overview.page';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: OverviewPage, pathMatch: 'full' },
      // Placeholders for the remaining handoff pages — wire as we build them.
      { path: 'inbox', component: OverviewPage },
      { path: 'canales', component: OverviewPage },
      { path: 'ajustes', component: OverviewPage },
      { path: 'recomendaciones', component: OverviewPage },
      { path: 'segmentos', component: OverviewPage },
      { path: 'equipo', component: OverviewPage },
    ],
  },
];
