import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const email = localStorage.getItem('email');
  const role = localStorage.getItem('role');

  if (email && (role === 'ADMIN' || role === 'STAFF' || role === 'ROLE_ADMIN' || role === 'ROLE_STAFF')) {
    return true;
  }

  if (!email) {
    router.navigate(['/login']);
  } else {
    router.navigate(['/']);
  }
  return false;
};
