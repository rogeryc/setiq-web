import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from './auth.service';

/**
 * Attaches the JWT to outgoing requests to the SETIQ API. On a 401 from
 * any protected endpoint, clears the stored token and bounces to /login
 * (the user's session has expired or been invalidated).
 *
 * The login endpoint itself is skipped on both legs — we don't want a
 * bad-password 401 to redirect; the form should show an inline error.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const isLogin = req.url.includes('/auth/login');
  const token = auth.token();

  const outgoing = !isLogin && token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(outgoing).pipe(
    catchError((err: unknown) => {
      if (!isLogin && err instanceof HttpErrorResponse && err.status === 401) {
        auth.logout();
        // logout() already navigates to /login; nothing else to do here.
      }
      return throwError(() => err);
    }),
  );
};
