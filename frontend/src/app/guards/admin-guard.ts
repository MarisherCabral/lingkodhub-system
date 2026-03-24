import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (user.role !== 'admin') {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};