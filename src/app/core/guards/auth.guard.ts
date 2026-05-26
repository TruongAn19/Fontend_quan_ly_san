import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

// FIX-S1: token lives in an httpOnly cookie — the FE only sees identity
// (email) in localStorage. If the cookie is gone but email remains, the
// next API call will 401 and the error.interceptor will redirect.
export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const email = localStorage.getItem('email');

  if (email) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
