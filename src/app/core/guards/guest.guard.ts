import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const guestGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('accessToken');

  if (!token) {
    return true;
  }

  const role = localStorage.getItem('role');
  if (role === 'ADMIN' || role === 'STAFF') {
    router.navigate(['/admin/dashboard']);
  } else {
    router.navigate(['/']);
  }
  return false;
};
