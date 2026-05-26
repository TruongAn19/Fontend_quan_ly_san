import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // FIX-S1: server side cookie is the source of truth; we just clear
        // the identity bits we kept locally for UI gating.
        localStorage.removeItem('email');
        localStorage.removeItem('role');
        router.navigate(['/login']);
      } else if (error.status === 403) {
        router.navigate(['/access-denied']);
      } else if (error.status === 400 && error.error?.data) {
        // Validation errors logic
        console.error('Validation Errors:', error.error.data);
      }

      return throwError(() => error);
    })
  );
};
