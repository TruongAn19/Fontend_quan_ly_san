import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        localStorage.removeItem('accessToken');
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
