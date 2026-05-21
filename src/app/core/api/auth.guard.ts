import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

import { AuthService } from './auth.service';

/**
 * Blocks protected routes when there's no token. APP_INITIALIZER has
 * already run restoreFromStorage() by the time any guard fires, so
 * reading the signal here is sufficient — no async wait needed.
 */
export const authGuard: CanActivateFn = (): boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.token() !== null ? true : router.createUrlTree(['/login']);
};
