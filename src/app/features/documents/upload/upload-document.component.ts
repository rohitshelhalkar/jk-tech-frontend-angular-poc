import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpEventType } from '@angular/common/http';

import { DocumentService } from '../../../core/services/document.service';

interface FileUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  id?: string;
}

@Component({
  selector: 'app-upload-document',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatChipsModule
  ],
  templateUrl: './upload-document.component.html',
  styleUrls: ['./upload-document.component.scss']
})
export class UploadDocumentComponent {
  fileUploads: FileUpload[] = [];
  isDragOver = false;
  isUploading = false;
  
  allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  
  maxFileSize = 10 * 1024 * 1024; // 10MB
  maxFiles = 10;

  constructor(
    private documentService: DocumentService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    
    if (event.dataTransfer?.files) {
      this.handleFiles(Array.from(event.dataTransfer.files));
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(Array.from(input.files));
      input.value = ''; // Reset input
    }
  }

  handleFiles(files: File[]): void {
    // Check if adding these files would exceed the limit
    if (this.fileUploads.length + files.length > this.maxFiles) {
      this.snackBar.open(`Maximum ${this.maxFiles} files allowed`, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    files.forEach(file => {
      if (this.validateFile(file)) {
        const fileUpload: FileUpload = {
          file: file,
          progress: 0,
          status: 'pending'
        };
        this.fileUploads.push(fileUpload);
      }
    });
  }

  validateFile(file: File): boolean {
    // Check file type
    if (!this.allowedTypes.includes(file.type)) {
      this.snackBar.open(`File type ${file.type} is not supported`, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return false;
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      this.snackBar.open(`File ${file.name} is too large (max 10MB)`, 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return false;
    }

    // Check for duplicates
    if (this.fileUploads.some(upload => upload.file.name === file.name && upload.file.size === file.size)) {
      this.snackBar.open(`File ${file.name} is already selected`, 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return false;
    }

    return true;
  }

  removeFile(index: number): void {
    if (this.fileUploads[index].status === 'uploading') {
      return; // Cannot remove files that are currently uploading
    }
    this.fileUploads.splice(index, 1);
  }

  uploadAllFiles(): void {
    const pendingFiles = this.fileUploads.filter(upload => upload.status === 'pending');
    
    if (pendingFiles.length === 0) {
      this.snackBar.open('No files to upload', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.isUploading = true;
    
    pendingFiles.forEach((fileUpload, index) => {
      this.uploadFile(fileUpload, index === pendingFiles.length - 1);
    });
  }

  uploadFile(fileUpload: FileUpload, isLast: boolean): void {
    fileUpload.status = 'uploading';
    
    const uploadRequest = { file: fileUpload.file };
    
    this.documentService.uploadDocument(uploadRequest).subscribe({
      next: (document: any) => {
        fileUpload.status = 'success';
        fileUpload.progress = 100;
        fileUpload.id = document.id;
        
        if (isLast) {
          this.onUploadComplete();
        }
      },
      error: (error) => {
        fileUpload.status = 'error';
        fileUpload.error = error.error?.message || 'Upload failed';
        console.error('Upload failed:', error);
        
        if (isLast) {
          this.onUploadComplete();
        }
      }
    });
  }

  onUploadComplete(): void {
    this.isUploading = false;
    
    const successCount = this.fileUploads.filter(upload => upload.status === 'success').length;
    const errorCount = this.fileUploads.filter(upload => upload.status === 'error').length;
    
    if (successCount > 0) {
      this.snackBar.open(
        `${successCount} file${successCount > 1 ? 's' : ''} uploaded successfully`,
        'Close',
        {
          duration: 5000,
          panelClass: ['success-snackbar']
        }
      );
    }
    
    if (errorCount > 0) {
      this.snackBar.open(
        `${errorCount} file${errorCount > 1 ? 's' : ''} failed to upload`,
        'Close',
        {
          duration: 5000,
          panelClass: ['error-snackbar']
        }
      );
    }
  }

  clearCompleted(): void {
    this.fileUploads = this.fileUploads.filter(
      upload => upload.status !== 'success' && upload.status !== 'error'
    );
  }

  goToDocuments(): void {
    this.router.navigate(['/documents']);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileTypeIcon(file: File): string {
    if (file.type.includes('pdf')) {
      return 'picture_as_pdf';
    } else if (file.type.includes('word') || file.type.includes('document')) {
      return 'description';
    } else if (file.type.includes('text')) {
      return 'text_snippet';
    } else {
      return 'insert_drive_file';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending':
        return 'schedule';
      case 'uploading':
        return 'cloud_upload';
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error';
      default:
        return 'help';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return '#666';
      case 'uploading':
        return '#2196f3';
      case 'success':
        return '#4caf50';
      case 'error':
        return '#f44336';
      default:
        return '#666';
    }
  }

  canUpload(): boolean {
    return this.fileUploads.some(upload => upload.status === 'pending') && !this.isUploading;
  }

  hasCompletedFiles(): boolean {
    return this.fileUploads.some(f => f.status === 'success' || f.status === 'error');
  }

  isUploading(fileUpload: FileUpload): boolean {
    return fileUpload.status === 'uploading';
  }

  isSuccess(fileUpload: FileUpload): boolean {
    return fileUpload.status === 'success';
  }

  isError(fileUpload: FileUpload): boolean {
    return fileUpload.status === 'error';
  }

  showProgress(fileUpload: FileUpload): boolean {
    return fileUpload.status === 'uploading' || fileUpload.status === 'success';
  }

  getMaxFiles(): number {
    return this.maxFiles;
  }
}