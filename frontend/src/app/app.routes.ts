import { Routes } from '@angular/router';

import { Landing } from './pages/landing/landing';
import { Register } from './pages/register/register';
import { Login } from './pages/login/login';

import { Dashboard } from './pages/dashboard/dashboard';
import { Admin } from './pages/admin/admin';
import { Request } from './pages/request/request';
import { MyRequests } from './pages/my-requests/my-requests';
import { Appointments } from './pages/appointments/appointments';
import { Profile } from './pages/profile/profile';


import { UserLayout } from './layout/user-layout/user-layout';
import { AdminLayout } from './layout/admin-layout/admin-layout';
import { AdminRequests } from './pages/admin-requests/admin-requests';
import { AdminAppointments } from './pages/admin-appointments/admin-appointments';


import { authGuard } from './guards/auth-guard';
import { adminGuard } from './guards/admin-guard';

export const routes: Routes = [

  // 🌐 PUBLIC ROUTES
  { path: '', component: Landing },
  { path: 'register', component: Register },
  { path: 'login', component: Login },

  // 👤 USER LAYOUT (WITH SIDEBAR)
  {
    path: '',
    component: UserLayout,
    canActivate: [authGuard],
    children: [

      { path: 'dashboard', component: Dashboard },
      { path: 'request', component: Request },
      { path: 'my-requests', component: MyRequests },

      // temporary placeholders
      { path: 'appointments', component: Appointments },
      { path: 'profile', component: Profile }

    ]
  },

  // 🔐 ADMIN
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', component: Admin },
      { path: 'requests', component: AdminRequests },
       { path: 'appointments', component: AdminAppointments }
    ]
  }


];