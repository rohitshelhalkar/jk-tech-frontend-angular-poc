import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { DocumentService } from '../../core/services/document.service';
import { AuthService } from '../../core/services/auth.service';
import { Document, DocumentStatus, DocumentsResponse } from '../../core/models/document.model';
import { UserRole } from '../../core/models/user.model';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './documents.component.html',
  styleUrls: ['./documents.component.scss']
})
export class DocumentsComponent implements OnInit {
  displayedColumns: string[] = ['fileName', 'fileSize', 'mimeType', 'status', 'createdAt', 'actions'];
  documents: Document[] = [];
  filteredDocuments: Document[] = [];
  isLoading = false;
  searchTerm = '';
  selectedStatus: DocumentStatus | 'ALL' = 'ALL';
  selectedMimeType: string | 'ALL' = 'ALL';

  UserRole = UserRole;
  DocumentStatus = DocumentStatus;
  
  statusOptions = [
    { value: 'ALL', label: 'All Status' },
    { value: DocumentStatus.UPLOADED, label: 'Uploaded' },
    { value: DocumentStatus.PROCESSING, label: 'Processing' },
    { value: DocumentStatus.PROCESSED, label: 'Processed' },
    { value: DocumentStatus.FAILED, label: 'Failed' }
  ];

  mimeTypeOptions = [
    { value: 'ALL', label: 'All Types' },
    { value: 'application/pdf', label: 'PDF' },
    { value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'DOCX' },
    { value: 'text/plain', label: 'TXT' }
  ];

  constructor(
    private documentService: DocumentService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.isLoading = true;
    this.documentService.getDocuments().subscribe({
      next: (response: DocumentsResponse) => {
        this.documents = response.documents;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load documents:', error);
        this.isLoading = false;
        this.snackBar.open('Failed to load documents', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  applyFilters(): void {
    this.filteredDocuments = this.documents.filter(document => {
      const matchesSearch = !this.searchTerm || 
        document.filename.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = this.selectedStatus === 'ALL' || document.status === this.selectedStatus;
      const matchesMimeType = this.selectedMimeType === 'ALL' || document.mimetype === this.selectedMimeType;
      
      return matchesSearch && matchesStatus && matchesMimeType;
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  onMimeTypeFilterChange(): void {
    this.applyFilters();
  }

  downloadDocument(document: Document): void {
    this.documentService.downloadDocument(document.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', document.filename);
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.snackBar.open('Document downloaded successfully', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: (error) => {
        console.error('Failed to download document:', error);
        this.snackBar.open('Failed to download document', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  deleteDocument(document: Document): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Document',
        message: `Are you sure you want to delete "${document.filename}"? This action cannot be undone.`,
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.documentService.deleteDocument(document.id).subscribe({
          next: () => {
            this.documents = this.documents.filter(d => d.id !== document.id);
            this.applyFilters();
            this.snackBar.open('Document deleted successfully', 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
          },
          error: (error) => {
            console.error('Failed to delete document:', error);
            this.snackBar.open('Failed to delete document', 'Close', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  triggerIngestion(document: Document): void {
    this.documentService.triggerIngestion(document.id).subscribe({
      next: () => {
        // Update document status optimistically
        const docIndex = this.documents.findIndex(d => d.id === document.id);
        if (docIndex !== -1) {
          this.documents[docIndex].status = DocumentStatus.PROCESSING;
          this.applyFilters();
        }
        
        this.snackBar.open('Ingestion job started successfully', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: (error: any) => {
        console.error('Failed to trigger ingestion:', error);
        this.snackBar.open('Failed to trigger ingestion', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  canManageDocuments(): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser ? [UserRole.ADMIN, UserRole.EDITOR].includes(currentUser.role) : false;
  }

  canTriggerIngestion(document: Document): boolean {
    return this.canManageDocuments() && document.status === DocumentStatus.UPLOADED;
  }

  canDeleteDocument(): boolean {
    return this.canManageDocuments();
  }

  getStatusChipColor(status: DocumentStatus): string {
    switch (status) {
      case DocumentStatus.UPLOADED:
        return 'primary';
      case DocumentStatus.PROCESSING:
        return 'accent';
      case DocumentStatus.PROCESSED:
        return '';
      case DocumentStatus.FAILED:
        return 'warn';
      default:
        return '';
    }
  }

  getMimeTypeIcon(mimeType: string): string {
    if (mimeType.includes('pdf')) {
      return 'picture_as_pdf';
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return 'description';
    } else if (mimeType.includes('text')) {
      return 'text_snippet';
    } else {
      return 'insert_drive_file';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  exportDocumentsList(): void {
    const csvContent = this.generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `documents-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  getProcessedCount(): number {
    return this.documents.filter(d => d.status === DocumentStatus.PROCESSED).length;
  }

  getProcessingCount(): number {
    return this.documents.filter(d => d.status === DocumentStatus.PROCESSING).length;
  }

  getTotalSize(): string {
    const totalBytes = this.documents.reduce((sum, d) => sum + d.size, 0);
    return this.formatFileSize(totalBytes);
  }

  private generateCSV(): string {
    const headers = ['File Name', 'File Size', 'Type', 'Status', 'Upload Date'];
    const csvRows = [headers.join(',')];
    
    this.filteredDocuments.forEach(doc => {
      const row = [
        `"${doc.filename}"`,
        this.formatFileSize(doc.size),
        doc.mimetype,
        doc.status,
        new Date(doc.createdAt).toLocaleDateString()
      ];
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  }
}