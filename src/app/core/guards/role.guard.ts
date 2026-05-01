import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const role = localStorage.getItem('role');
  const expectedRoles = route.data?.['expectedRoles'] as string[];

  if (role && expectedRoles && expectedRoles.includes(role)) {
    return true;
  }

  router.navigate(['/access-denied']);
  return false;
};
