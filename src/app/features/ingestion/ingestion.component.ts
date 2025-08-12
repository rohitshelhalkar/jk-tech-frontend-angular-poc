import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

import { IngestionService } from '../../core/services/ingestion.service';
import { AuthService } from '../../core/services/auth.service';
import { IngestionJob, IngestionStatus, IngestionJobsQuery } from '../../core/models/ingestion.model';
import { UserRole } from '../../core/models/user.model';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-ingestion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatTooltipModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './ingestion.component.html',
  styleUrls: ['./ingestion.component.scss']
})
export class IngestionComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['document', 'status', 'duration', 'startedAt', 'completedAt', 'user', 'actions'];
  ingestionJobs: IngestionJob[] = [];
  isLoading = false;
  selectedStatus: IngestionStatus | 'ALL' = 'ALL';

  // Pagination
  pageSize = 10;
  pageIndex = 0;
  totalJobs = 0;

  // Polling
  private pollingSubscription?: Subscription;
  private readonly POLLING_INTERVAL = 5000; // 5 seconds

  IngestionStatus = IngestionStatus;
  UserRole = UserRole;

  statusOptions = [
    { value: 'ALL', label: 'All Status' },
    { value: IngestionStatus.PENDING, label: 'Pending' },
    { value: IngestionStatus.COMPLETED, label: 'Completed' },
    { value: IngestionStatus.FAILED, label: 'Failed' }
  ];

  constructor(
    private ingestionService: IngestionService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadIngestionJobs();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  loadIngestionJobs(): void {
    this.isLoading = true;
    
    const query: IngestionJobsQuery = {
      page: this.pageIndex + 1,
      limit: this.pageSize,
      status: this.selectedStatus === 'ALL' ? undefined : this.selectedStatus
    };

    this.ingestionService.getIngestionJobs(query).subscribe({
      next: (response) => {
        this.ingestionJobs = response.jobs;
        this.totalJobs = response.pagination.total;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load ingestion jobs:', error);
        this.isLoading = false;
        this.snackBar.open('Failed to load ingestion jobs', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onStatusFilterChange(): void {
    this.pageIndex = 0; // Reset to first page when filtering
    this.loadIngestionJobs();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadIngestionJobs();
  }

  startPolling(): void {
    this.pollingSubscription = this.ingestionService.startPollingJobsList({
      page: this.pageIndex + 1,
      limit: this.pageSize,
      status: this.selectedStatus === 'ALL' ? undefined : this.selectedStatus
    }).subscribe({
      next: (response) => {
        this.ingestionJobs = response.jobs;
        this.totalJobs = response.pagination.total;
      },
      error: (error) => {
        console.error('Polling error:', error);
        // Don't show snackbar for polling errors to avoid spam
      }
    });
  }

  stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.ingestionService.stopPollingJobStatus();
    }
  }

  refreshJobs(): void {
    this.loadIngestionJobs();
  }

  getStatusColor(status: IngestionStatus): string {
    return this.ingestionService.getStatusColor(status);
  }

  getStatusIcon(status: IngestionStatus): string {
    return this.ingestionService.getStatusIcon(status);
  }

  getStatusClass(status: IngestionStatus): string {
    return this.ingestionService.getStatusClass(status);
  }

  getJobDuration(job: IngestionJob): string {
    return this.ingestionService.getJobDuration(job.startedAt, job.completedAt);
  }

  isJobInProgress(status: IngestionStatus): boolean {
    return this.ingestionService.isJobInProgress(status);
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return 'N/A';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getTotalPages(): number {
    return Math.ceil(this.totalJobs / this.pageSize);
  }

  getCurrentUser() {
    return this.authService.getCurrentUser();
  }

  canViewAllJobs(): boolean {
    const user = this.getCurrentUser();
    return user ? [UserRole.ADMIN, UserRole.EDITOR].includes(user.role) : false;
  }

  exportJobsList(): void {
    const csvContent = this.generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `ingestion-jobs-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  private generateCSV(): string {
    const headers = ['Job ID', 'Document Name', 'Status', 'Duration', 'Started At', 'Completed At', 'User', 'Error Message'];
    const csvRows = [headers.join(',')];
    
    this.ingestionJobs.forEach(job => {
      const row = [
        `"${job.id}"`,
        `"${job.document.originalName}"`,
        job.status,
        this.getJobDuration(job),
        this.formatDate(job.startedAt),
        this.formatDate(job.completedAt),
        `"${job.user.name}"`,
        `"${job.errorMessage || ''}"`
      ];
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  }

  getCompletedJobsCount(): number {
    return this.ingestionJobs.filter(job => job.status === IngestionStatus.COMPLETED).length;
  }

  getFailedJobsCount(): number {
    return this.ingestionJobs.filter(job => job.status === IngestionStatus.FAILED).length;
  }

  getPendingJobsCount(): number {
    return this.ingestionJobs.filter(job => job.status === IngestionStatus.PENDING).length;
  }
}