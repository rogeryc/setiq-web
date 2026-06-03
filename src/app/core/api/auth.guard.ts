import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

import { AuthService } from './auth.service';

/**
 * Blocks protected routes when there's no token. On the server there is no
 * localStorage, so auth is deferred to the client: the browser restores the
 * token in APP_INITIALIZER before the client-side guard runs. Enforcing on the
 * server would render /login for an authenticated user on every full reload.
 */
export const authGuard: CanActivateFn = (): boolean | UrlTree => {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return true;
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.token() !== null ? true : router.createUrlTree(['/login']);
};
