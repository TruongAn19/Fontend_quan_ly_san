import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('accessToken');
  const role = localStorage.getItem('role');

  if (token && (role === 'ADMIN' || role === 'STAFF' || role === 'ROLE_ADMIN' || role === 'ROLE_STAFF')) {
    return true;
  }

  if (!token) {
    router.navigate(['/login']);
  } else {
    router.navigate(['/']);
  }
  return false;
};
