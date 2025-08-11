import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'documents',
    loadComponent: () => import('./features/documents/documents.component').then(m => m.DocumentsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'documents/upload',
    loadComponent: () => import('./features/documents/upload/upload-document.component').then(m => m.UploadDocumentComponent),
    canActivate: [authGuard]
  },
  {
    path: 'users',
    loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent),
    canActivate: [authGuard, adminGuard]
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];