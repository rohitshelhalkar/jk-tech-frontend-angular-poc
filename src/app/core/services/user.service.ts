import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { 
  User, 
  CreateUserRequest, 
  UpdateUserRequest 
} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = environment.apiUrl + environment.apiEndpoints.users;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.API_URL)
      .pipe(catchError(this.handleError));
  }

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/${id}`)
      .pipe(catchError(this.handleError));
  }

  createUser(userData: CreateUserRequest): Observable<User> {
    return this.http.post<User>(this.API_URL, userData)
      .pipe(catchError(this.handleError));
  }

  updateUser(id: string, userData: UpdateUserRequest): Observable<User> {
    return this.http.patch<User>(`${this.API_URL}/${id}`, userData)
      .pipe(catchError(this.handleError));
  }

  deleteUser(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/${id}`)
      .pipe(catchError(this.handleError));
  }

  activateUser(id: string): Observable<User> {
    return this.updateUser(id, { active: true });
  }

  deactivateUser(id: string): Observable<User> {
    return this.updateUser(id, { active: false });
  }

  changeUserRole(id: string, role: string): Observable<User> {
    return this.updateUser(id, { role: role as any });
  }

  private handleError(error: any): Observable<never> {
    console.error('User service error:', error);
    return throwError(() => error);
  }
}