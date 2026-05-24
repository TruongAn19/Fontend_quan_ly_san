import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Đồng bộ clear token + reset currentUser/role signals + redirect.
        // Xoá riêng localStorage là không đủ — header navbar vẫn render
        // "đang đăng nhập" do signal AuthService.currentUser chưa được set null.
        authService.logout();
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
