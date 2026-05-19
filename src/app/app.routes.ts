import { Routes } from '@angular/router';

import { ChannelsPage } from './pages/channels/channels.page';
import { InboxPage } from './pages/inbox/inbox.page';
import { LayoutComponent } from './layout/layout';
import { OverviewPage } from './pages/overview/overview.page';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: OverviewPage, pathMatch: 'full' },
      { path: 'inbox', component: InboxPage },
      { path: 'canales', component: ChannelsPage },
      // Placeholders for the remaining handoff pages — wire as we build them.
      { path: 'ajustes', component: OverviewPage },
      { path: 'recomendaciones', component: OverviewPage },
      { path: 'segmentos', component: OverviewPage },
      { path: 'equipo', component: OverviewPage },
    ],
  },
];
