import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * FIX-S1: token is delivered via an httpOnly cookie set by the BE on /login.
 * Every same-origin (or CORS-allowed) request to the API now needs
 * `withCredentials: true` so the browser actually sends the cookie back.
 *
 * We don't attach an Authorization header anymore — the BE filter still
 * accepts it as a fallback for non-browser clients (Postman, mobile),
 * but the SPA itself relies purely on the cookie.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiBaseUrl)) {
    return next(req);
  }
  if (req.withCredentials) {
    return next(req);
  }
  return next(req.clone({ withCredentials: true }));
};
