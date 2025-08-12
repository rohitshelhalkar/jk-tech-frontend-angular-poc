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
    <div class="confirm-dialog-container">
      <div class="dialog-header" [ngClass]="'header-' + data.type">
        <div class="icon-wrapper" [ngClass]="'icon-wrapper-' + data.type">
          <mat-icon [ngClass]="'icon-' + data.type">
            {{ getIcon() }}
          </mat-icon>
        </div>
        <div class="header-content">
          <h2 mat-dialog-title>{{ data.title }}</h2>
        </div>
      </div>
      
      <mat-dialog-content class="dialog-content">
        <div class="message-content">
          <p>{{ data.message }}</p>
        </div>
      </mat-dialog-content>
      
      <mat-dialog-actions class="dialog-actions">
        <button 
          mat-button 
          (click)="onCancel()"
          class="cancel-button">
          {{ data.cancelText || 'Cancel' }}
        </button>
        <button 
          mat-raised-button 
          [color]="getButtonColor()" 
          (click)="onConfirm()" 
          [ngClass]="'confirm-button confirm-' + data.type"
          cdkFocusInitial>
          {{ data.confirmText || 'Confirm' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog-container {
      min-width: 420px;
      max-width: 520px;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15), 0 6px 24px rgba(0, 0, 0, 0.1);
    }
    
    .dialog-header {
      padding: 32px 32px 24px 32px;
      display: flex;
      align-items: center;
      gap: 20px;
      position: relative;
      
      &.header-danger {
        background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
        color: white;
      }
      
      &.header-warning {
        background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
        color: white;
      }
      
      &.header-info {
        background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
        color: white;
      }
      
      h2 {
        margin: 0;
        font-weight: 600;
        font-size: 20px;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      }
    }
    
    .icon-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border: 2px solid rgba(255, 255, 255, 0.2);
      flex-shrink: 0;
      
      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: white;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      }
    }
    
    .header-content {
      flex: 1;
    }
    
    .dialog-content {
      padding: 32px 32px 24px 32px;
      background: #fafafa;
      min-height: 80px;
      display: flex;
      align-items: center;
    }
    
    .message-content {
      background: white;
      padding: 24px 28px;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(0, 0, 0, 0.06);
      width: 100%;
      
      p {
        margin: 0;
        line-height: 1.6;
        font-size: 15px;
        color: #444;
        font-weight: 400;
      }
    }
    
    .dialog-actions {
      padding: 24px 32px 32px 32px;
      background: #f8f9fa;
      border-top: 1px solid #e9ecef;
      justify-content: flex-end;
      gap: 16px;
      margin: 0;
    }
    
    .cancel-button {
      color: #666;
      font-weight: 500;
      padding: 12px 24px;
      border-radius: 8px;
      transition: all 0.2s ease;
      min-width: 100px;
      
      &:hover {
        background: rgba(0, 0, 0, 0.04);
        color: #333;
      }
    }
    
    .confirm-button {
      min-width: 120px;
      height: 44px;
      font-weight: 600;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.2s ease;
      text-transform: none;
      
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
      }
      
      &.confirm-danger {
        background: linear-gradient(135deg, #f44336, #d32f2f) !important;
        box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
        
        &:hover {
          box-shadow: 0 6px 16px rgba(244, 67, 54, 0.4);
        }
      }
      
      &.confirm-warning {
        background: linear-gradient(135deg, #ff9800, #f57c00) !important;
        box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
        
        &:hover {
          box-shadow: 0 6px 16px rgba(255, 152, 0, 0.4);
        }
      }
      
      &.confirm-info {
        box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
        
        &:hover {
          box-shadow: 0 6px 16px rgba(25, 118, 210, 0.4);
        }
      }
    }

    // Responsive design
    @media (max-width: 768px) {
      .confirm-dialog-container {
        min-width: 320px;
        max-width: 90vw;
      }
      
      .dialog-header {
        padding: 24px 24px 20px 24px;
        gap: 16px;
        
        h2 {
          font-size: 18px;
        }
      }
      
      .icon-wrapper {
        width: 48px;
        height: 48px;
        
        mat-icon {
          font-size: 28px;
          width: 28px;
          height: 28px;
        }
      }
      
      .dialog-content {
        padding: 24px 24px 20px 24px;
      }
      
      .message-content {
        padding: 20px 20px;
        
        p {
          font-size: 14px;
        }
      }
      
      .dialog-actions {
        padding: 20px 24px 24px 24px;
        flex-direction: column-reverse;
        gap: 12px;
        
        button {
          width: 100%;
          justify-content: center;
        }
        
        .confirm-button {
          height: 48px;
        }
      }
    }

    @media (max-width: 480px) {
      .dialog-header {
        padding: 20px 20px 16px 20px;
      }
      
      .dialog-content {
        padding: 20px 20px 16px 20px;
      }
      
      .message-content {
        padding: 16px;
      }
      
      .dialog-actions {
        padding: 16px 20px 20px 20px;
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