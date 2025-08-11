import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { AuthService } from '../../core/services/auth.service';
import { DocumentService } from '../../core/services/document.service';
import { IngestionService } from '../../core/services/ingestion.service';
import { User, UserRole } from '../../core/models/user.model';
import { Document, DocumentsResponse } from '../../core/models/document.model';
import { IngestionJob, IngestionJobsResponse, IngestionStatus } from '../../core/models/ingestion.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule,
    MatProgressBarModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  currentUser$: Observable<User | null>;
  UserRole = UserRole;
  
  // Dashboard stats
  totalDocuments = 0;
  recentDocuments: Document[] = [];
  activeIngestionJobs: IngestionJob[] = [];
  completedQueriesCount = 0;
  
  // Quick actions based on user role
  quickActions: { icon: string; title: string; description: string; route: string; roles: UserRole[] }[] = [
    {
      icon: 'upload_file',
      title: 'Upload Documents',
      description: 'Upload new documents for processing',
      route: '/documents/upload',
      roles: [UserRole.ADMIN, UserRole.EDITOR]
    },
    {
      icon: 'folder',
      title: 'My Documents',
      description: 'View and manage your documents',
      route: '/documents',
      roles: [UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER]
    },
    {
      icon: 'psychology',
      title: 'Ask Questions',
      description: 'Query your documents using AI',
      route: '/qa',
      roles: [UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER]
    },
    {
      icon: 'sync',
      title: 'Ingestion Jobs',
      description: 'Monitor document processing',
      route: '/ingestion',
      roles: [UserRole.ADMIN, UserRole.EDITOR]
    },
    {
      icon: 'people',
      title: 'Manage Users',
      description: 'Admin user management',
      route: '/users',
      roles: [UserRole.ADMIN]
    }
  ];

  constructor(
    private authService: AuthService,
    private documentService: DocumentService,
    private ingestionService: IngestionService
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    // Load dashboard statistics
    this.documentService.getDocuments().subscribe({
      next: (response: DocumentsResponse) => {
        this.totalDocuments = response.documents.length;
        this.recentDocuments = response.documents
          .sort((a: Document, b: Document) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
      },
      error: (error) => {
        console.error('Failed to load documents:', error);
      }
    });

    this.ingestionService.getIngestionJobs().subscribe({
      next: (response: IngestionJobsResponse) => {
        this.activeIngestionJobs = response.jobs.filter((job: IngestionJob) => 
          job.status === IngestionStatus.PROCESSING || job.status === IngestionStatus.PENDING
        ).slice(0, 3);
      },
      error: (error) => {
        console.error('Failed to load ingestion jobs:', error);
      }
    });
  }

  hasRole(requiredRoles: UserRole[]): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser ? requiredRoles.includes(currentUser.role) : false;
  }

  getFilteredActions() {
    return this.quickActions.filter(action => this.hasRole(action.roles));
  }

  getWelcomeMessage(): string {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return 'Welcome';
    
    const timeOfDay = new Date().getHours();
    let greeting = 'Hello';
    
    if (timeOfDay < 12) {
      greeting = 'Good morning';
    } else if (timeOfDay < 17) {
      greeting = 'Good afternoon';
    } else {
      greeting = 'Good evening';
    }
    
    return `${greeting}, ${currentUser.name}`;
  }

  getRoleDisplayName(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return 'Administrator';
      case UserRole.EDITOR:
        return 'Editor';
      case UserRole.VIEWER:
        return 'Viewer';
      default:
        return 'User';
    }
  }

  getProgressBarValue(job: IngestionJob): number {
    switch (job.status) {
      case IngestionStatus.PENDING:
        return 0;
      case IngestionStatus.PROCESSING:
        return 50;
      case IngestionStatus.COMPLETED:
        return 100;
      case IngestionStatus.FAILED:
        return 100;
      default:
        return 0;
    }
  }

  getProgressBarColor(job: IngestionJob): string {
    switch (job.status) {
      case IngestionStatus.PROCESSING:
        return 'primary';
      case IngestionStatus.COMPLETED:
        return 'accent';
      case IngestionStatus.FAILED:
        return 'warn';
      default:
        return 'primary';
    }
  }
}