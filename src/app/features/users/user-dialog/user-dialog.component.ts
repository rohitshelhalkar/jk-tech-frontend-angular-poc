import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { User, UserRole } from '../../../core/models/user.model';

export interface UserDialogData {
  user: User | null;
  isEdit: boolean;
}

@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './user-dialog.component.html',
  styleUrls: ['./user-dialog.component.scss']
})
export class UserDialogComponent {
  userForm: FormGroup;
  isEdit: boolean;
  
  roles = [
    { value: UserRole.VIEWER, label: 'Viewer', description: 'Can view and download own documents' },
    { value: UserRole.EDITOR, label: 'Editor', description: 'Can manage documents and trigger ingestion' },
    { value: UserRole.ADMIN, label: 'Administrator', description: 'Full access to all features' }
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserDialogData
  ) {
    this.isEdit = data.isEdit;
    
    this.userForm = this.fb.group({
      name: [data.user?.name || '', [Validators.required, Validators.minLength(2)]],
      email: [data.user?.email || '', [Validators.required, Validators.email]],
      role: [data.user?.role || UserRole.VIEWER, [Validators.required]]
    });

    // Add password field for new users
    if (!this.isEdit) {
      this.userForm.addControl('password', this.fb.control('', [Validators.required, Validators.minLength(6)]));
    }
  }

  getTitle(): string {
    return this.isEdit ? 'Edit User' : 'Create User';
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.dialogRef.close(this.userForm.value);
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getNameErrorMessage(): string {
    const nameControl = this.userForm.get('name');
    if (nameControl?.hasError('required')) {
      return 'Name is required';
    }
    if (nameControl?.hasError('minlength')) {
      return 'Name must be at least 2 characters long';
    }
    return '';
  }

  getEmailErrorMessage(): string {
    const emailControl = this.userForm.get('email');
    if (emailControl?.hasError('required')) {
      return 'Email is required';
    }
    if (emailControl?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    return '';
  }

  getPasswordErrorMessage(): string {
    const passwordControl = this.userForm.get('password');
    if (passwordControl?.hasError('required')) {
      return 'Password is required';
    }
    if (passwordControl?.hasError('minlength')) {
      return 'Password must be at least 6 characters long';
    }
    return '';
  }

  private markFormGroupTouched(): void {
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm.get(key);
      control?.markAsTouched();
    });
  }
}