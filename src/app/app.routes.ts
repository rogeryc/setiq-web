import { Routes } from '@angular/router';

import { AjustesPage } from './pages/ajustes/ajustes.page';
import { authGuard } from './core/api/auth.guard';
import { ChannelsPage } from './pages/channels/channels.page';
import { EquipoPage } from './pages/equipo/equipo.page';
import { InboxPage } from './pages/inbox/inbox.page';
import { LayoutComponent } from './layout/layout';
import { LoginPage } from './pages/login/login.page';
import { OverviewPage } from './pages/overview/overview.page';
import { RecomendacionesPage } from './pages/recomendaciones/recomendaciones.page';
import { SegmentosPage } from './pages/segmentos/segmentos.page';

export const routes: Routes = [
  { path: 'login', component: LoginPage },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: OverviewPage, pathMatch: 'full' },
      { path: 'inbox', component: InboxPage },
      { path: 'canales', component: ChannelsPage },
      { path: 'segmentos', component: SegmentosPage },
      { path: 'recomendaciones', component: RecomendacionesPage },
      { path: 'equipo', component: EquipoPage },
      { path: 'ajustes', component: AjustesPage },
    ],
  },
];
