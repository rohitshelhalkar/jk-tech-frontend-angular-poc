import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

import { UserService } from '../../core/services/user.service';
import { User, UserRole } from '../../core/models/user.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { UserDialogComponent } from './user-dialog/user-dialog.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatSortModule,
    MatMenuModule,
    MatDividerModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  displayedColumns: string[] = ['name', 'email', 'role', 'status', 'createdAt', 'actions'];
  users: User[] = [];
  filteredUsers: User[] = [];
  isLoading = false;
  searchTerm = '';
  selectedRole: UserRole | 'ALL' = 'ALL';
  
  UserRole = UserRole;
  roles = [
    { value: 'ALL', label: 'All Roles' },
    { value: UserRole.ADMIN, label: 'Administrator' },
    { value: UserRole.EDITOR, label: 'Editor' },
    { value: UserRole.VIEWER, label: 'Viewer' }
  ];

  constructor(
    private userService: UserService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load users:', error);
        this.isLoading = false;
        this.snackBar.open('Failed to load users', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  applyFilters(): void {
    this.filteredUsers = this.users.filter(user => {
      const matchesSearch = !this.searchTerm || 
        user.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesRole = this.selectedRole === 'ALL' || user.role === this.selectedRole;
      
      return matchesSearch && matchesRole;
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onRoleFilterChange(): void {
    this.applyFilters();
  }

  openCreateUserDialog(): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '500px',
      data: { user: null, isEdit: false }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createUser(result);
      }
    });
  }

  openEditUserDialog(user: User): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '500px',
      data: { user: { ...user }, isEdit: true }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateUser(user.id, result);
      }
    });
  }

  createUser(userData: any): void {
    this.userService.createUser(userData).subscribe({
      next: (user) => {
        this.users.push(user);
        this.applyFilters();
        this.snackBar.open('User created successfully', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: (error) => {
        console.error('Failed to create user:', error);
        this.snackBar.open('Failed to create user', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  updateUser(userId: string, userData: any): void {
    // Filter userData to only include allowed fields: email, name, role, and status
    const allowedFields = ['email', 'name', 'role', 'active'];
    const filteredUserData: any = {};
    
    allowedFields.forEach(field => {
      if (userData.hasOwnProperty(field) && userData[field] !== undefined && userData[field] !== null) {
        filteredUserData[field] = userData[field];
      }
    });

    this.userService.updateUser(userId, filteredUserData).subscribe({
      next: (updatedUser) => {
        const index = this.users.findIndex(u => u.id === userId);
        if (index !== -1) {
          this.users[index] = updatedUser;
          this.applyFilters();
        }
        this.snackBar.open('User updated successfully', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: (error) => {
        console.error('Failed to update user:', error);
        this.snackBar.open('Failed to update user', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  deleteUser(user: User): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete User',
        message: `Are you sure you want to delete user "${user.name}"? This action cannot be undone.`,
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.userService.deleteUser(user.id).subscribe({
          next: () => {
            this.users = this.users.filter(u => u.id !== user.id);
            this.applyFilters();
            this.snackBar.open('User deleted successfully', 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
          },
          error: (error) => {
            console.error('Failed to delete user:', error);
            this.snackBar.open('Failed to delete user', 'Close', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
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
        return 'Unknown';
    }
  }

  getRoleChipColor(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return 'warn';
      case UserRole.EDITOR:
        return 'accent';
      case UserRole.VIEWER:
        return 'primary';
      default:
        return '';
    }
  }

  toggleUserStatus(user: User): void {
    const newStatus = !user.active;
    const action = newStatus ? 'activate' : 'deactivate';
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
        message: `Are you sure you want to ${action} user "${user.name}"?`,
        type: newStatus ? 'primary' : 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.userService.updateUser(user.id, { active: newStatus }).subscribe({
          next: (updatedUser) => {
            const index = this.users.findIndex(u => u.id === user.id);
            if (index !== -1) {
              this.users[index] = updatedUser;
              this.applyFilters();
            }
            this.snackBar.open(`User ${action}d successfully`, 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
          },
          error: (error) => {
            console.error(`Failed to ${action} user:`, error);
            this.snackBar.open(`Failed to ${action} user`, 'Close', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  getStatusDisplayName(active: boolean): string {
    return active ? 'Active' : 'Inactive';
  }

  getStatusChipColor(active: boolean): string {
    return active ? 'primary' : 'warn';
  }

  exportUsers(): void {
    const csvContent = this.generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `users-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  private generateCSV(): string {
    const headers = ['Name', 'Email', 'Role', 'Status', 'Created At'];
    const csvRows = [headers.join(',')];
    
    this.filteredUsers.forEach(user => {
      const row = [
        user.name,
        user.email,
        this.getRoleDisplayName(user.role),
        this.getStatusDisplayName(user.active),
        new Date(user.createdAt).toLocaleDateString()
      ];
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  }
}