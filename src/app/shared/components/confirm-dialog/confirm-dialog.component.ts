import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-dialog">
      <div class="dialog-header" [class]="'dialog-header-' + data.type">
        <mat-icon [class]="'icon-' + data.type">
          {{ getIcon() }}
        </mat-icon>
        <h2 mat-dialog-title>{{ data.title }}</h2>
      </div>
      
      <mat-dialog-content>
        <p>{{ data.message }}</p>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">
          {{ data.cancelText || 'Cancel' }}
        </button>
        <button 
          mat-raised-button 
          [color]="getButtonColor()" 
          (click)="onConfirm()" 
          cdkFocusInitial>
          {{ data.confirmText || 'Confirm' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      min-width: 300px;
    }
    
    .dialog-header {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
      
      mat-icon {
        margin-right: 12px;
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
      
      h2 {
        margin: 0;
      }
    }
    
    .icon-danger {
      color: #f44336;
    }
    
    .icon-warning {
      color: #ff9800;
    }
    
    .icon-info {
      color: #2196f3;
    }
    
    mat-dialog-content {
      margin-bottom: 16px;
      
      p {
        margin: 0;
        line-height: 1.5;
      }
    }
    
    mat-dialog-actions {
      margin: 0 -24px -24px -24px;
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
      
      button {
        margin-left: 8px;
      }
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {
    this.data.type = this.data.type || 'info';
  }

  getIcon(): string {
    switch (this.data.type) {
      case 'danger':
        return 'warning';
      case 'warning':
        return 'warning';
      default:
        return 'help';
    }
  }

  getButtonColor(): string {
    switch (this.data.type) {
      case 'danger':
        return 'warn';
      case 'warning':
        return 'warn';
      default:
        return 'primary';
    }
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}