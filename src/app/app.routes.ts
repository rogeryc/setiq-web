import { Routes } from '@angular/router';

import { LayoutComponent } from './layout/layout';
import { InboxPage } from './pages/inbox/inbox.page';
import { OverviewPage } from './pages/overview/overview.page';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: OverviewPage, pathMatch: 'full' },
      { path: 'inbox', component: InboxPage },
      // Placeholders for the remaining handoff pages — wire as we build them.
      { path: 'canales', component: OverviewPage },
      { path: 'ajustes', component: OverviewPage },
      { path: 'recomendaciones', component: OverviewPage },
      { path: 'segmentos', component: OverviewPage },
      { path: 'equipo', component: OverviewPage },
    ],
  },
];
