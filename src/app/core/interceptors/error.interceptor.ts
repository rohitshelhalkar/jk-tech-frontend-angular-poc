import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Error: ${error.error.message}`;
      } else {
        // Server-side error
        switch (error.status) {
          case 401:
            errorMessage = 'Unauthorized access. Please login again.';
            authService.logout();
            router.navigate(['/auth/login']);
            break;
          case 403:
            errorMessage = 'Access forbidden. You do not have permission to access this resource.';
            break;
          case 404:
            errorMessage = 'Resource not found.';
            break;
          case 409:
            errorMessage = error.error?.message || 'Conflict occurred.';
            break;
          case 422:
            errorMessage = 'Validation error occurred.';
            break;
          case 500:
            errorMessage = 'Internal server error. Please try again later.';
            break;
          default:
            if (error.error?.message) {
              errorMessage = error.error.message;
            } else {
              errorMessage = `Server returned code: ${error.status}, error message: ${error.message}`;
            }
        }
      }

      // Show error message to user (except for 401 during login)
      if (!(error.status === 401 && req.url.includes('/auth/login'))) {
        snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }

      return throwError(() => error);
    })
  );
};