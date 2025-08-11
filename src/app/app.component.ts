import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, filter, map } from 'rxjs';

import { AuthService } from './core/services/auth.service';
import { User, UserRole } from './core/models/user.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  @ViewChild('drawer') drawer!: MatSidenav;
  
  title = 'JK Tech - Document Management';
  
  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(map(result => result.matches));
  
  currentUser$: Observable<User | null>;
  isLoggedIn$: Observable<boolean>;
  showSidenav = true;

  menuItems = [
    { path: '/dashboard', icon: 'dashboard', label: 'Dashboard', roles: ['ADMIN', 'EDITOR', 'VIEWER'] },
    { path: '/users', icon: 'people', label: 'User Management', roles: ['ADMIN'] },
    { path: '/documents', icon: 'folder', label: 'Documents', roles: ['ADMIN', 'EDITOR', 'VIEWER'] },
    { path: '/ingestion', icon: 'sync', label: 'Ingestion', roles: ['ADMIN', 'EDITOR', 'VIEWER'] },
    { path: '/qa', icon: 'question_answer', label: 'Q&A', roles: ['ADMIN', 'EDITOR', 'VIEWER'] }
  ];

  constructor(
    private breakpointObserver: BreakpointObserver,
    private authService: AuthService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
    this.isLoggedIn$ = this.authService.isLoggedIn$;
  }

  ngOnInit() {
    // Hide sidenav on auth pages
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event: NavigationEnd) => event.url)
    ).subscribe(url => {
      this.showSidenav = !url.includes('/auth');
    });
  }

  closeDrawerOnMobile() {
    this.isHandset$.subscribe(isHandset => {
      if (isHandset && this.drawer) {
        this.drawer.close();
      }
    });
  }

  canShowMenuItem(item: any, user: User | null): boolean {
    if (!user) return false;
    return item.roles.includes(user.role);
  }

  getUserRoleClass(role: UserRole): string {
    return `role-badge role-${role.toLowerCase()}`;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}