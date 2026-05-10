import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then(m => m.HomeComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then(m => m.RegisterComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password').then(m => m.ForgotPasswordComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/auth/reset-password/reset-password').then(m => m.ResetPasswordComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: 'products',
    loadComponent: () => import('./features/products/products').then(m => m.ProductsComponent)
  },
  {
    path: 'products/detail/:id',
    loadComponent: () => import('./features/products/detail/detail').then(m => m.ProductDetailComponent)
  },
  {
    path: 'equipments',
    loadComponent: () => import('./features/equipments/equipments').then(m => m.EquipmentsComponent)
  },
  {
    path: 'equipments/detail/:id',
    loadComponent: () => import('./features/equipments/detail/detail').then(m => m.EquipmentDetailComponent)
  },
  {
    path: 'booking/:id',
    loadComponent: () => import('./features/booking/booking').then(m => m.BookingComponent),
    canActivate: [authGuard]
  },
  {
    path: 'booking-success',
    loadComponent: () => import('./features/booking-success/booking-success').then(m => m.BookingSuccessComponent),
    canActivate: [authGuard]
  },
  {
    path: 'booking-history',
    loadComponent: () => import('./features/booking-history/booking-history').then(m => m.BookingHistoryComponent),
    canActivate: [authGuard]
  },
  {
    path: 'rentals/:id',
    loadComponent: () => import('./features/rental/rental').then(m => m.RentalComponent),
    canActivate: [authGuard]
  },
  {
    path: 'rental-success',
    loadComponent: () => import('./features/rental-success/rental-success').then(m => m.RentalSuccessComponent),
    canActivate: [authGuard]
  },
  {
    path: 'rental-history',
    loadComponent: () => import('./features/rental-history/rental-history').then(m => m.RentalHistoryComponent),
    canActivate: [authGuard]
  },
  {
    path: 'payments/vnpay-callback',
    loadComponent: () => import('./features/payment-callback/payment-callback').then(m => m.PaymentCallbackComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin/dashboard',
    loadComponent: () => import('./features/admin/dashboard/dashboard').then(m => m.AdminDashboardComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/users',
    loadComponent: () => import('./features/admin/users/users').then(m => m.AdminUsersComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/products',
    loadComponent: () => import('./features/admin/products/products').then(m => m.AdminProductsComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/equipments',
    loadComponent: () => import('./features/admin/equipments/equipments').then(m => m.AdminEquipmentsComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/bookings',
    loadComponent: () => import('./features/admin/bookings/bookings').then(m => m.AdminBookingsComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/rentals',
    loadComponent: () => import('./features/admin/rentals/rentals').then(m => m.AdminRentalsComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/ntfy',
    loadComponent: () => import('./features/admin/ntfy/ntfy').then(m => m.AdminNtfyComponent),
    canActivate: [adminGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
