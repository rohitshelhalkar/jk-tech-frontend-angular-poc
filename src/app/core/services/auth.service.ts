import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { 
  User, 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest 
} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private readonly TOKEN_KEY = environment.storage.tokenKey;
  private readonly USER_KEY = environment.storage.userKey;

  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  private isLoggedInSubject = new BehaviorSubject<boolean>(!!this.getToken());

  public currentUser$ = this.currentUserSubject.asObservable();
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(private http: HttpClient) {
    // Check token validity on service initialization
    this.validateToken();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}${environment.apiEndpoints.auth.login}`, credentials)
      .pipe(
        tap(response => {
          this.setToken(response.accessToken);
          this.loadUserProfile();
        }),
        catchError(this.handleError)
      );
  }

  register(userData: RegisterRequest): Observable<User> {
    return this.http.post<User>(`${this.API_URL}${environment.apiEndpoints.auth.register}`, userData)
      .pipe(
        catchError(this.handleError)
      );
  }

  logout(): void {
    this.removeToken();
    this.removeUser();
    this.currentUserSubject.next(null);
    this.isLoggedInSubject.next(false);
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}${environment.apiEndpoints.auth.profile}`)
      .pipe(
        tap(user => {
          this.setUser(user);
          this.currentUserSubject.next(user);
          this.isLoggedInSubject.next(true);
        }),
        catchError(this.handleError)
      );
  }

  refreshUserProfile(): void {
    if (this.getToken()) {
      this.loadUserProfile();
    }
  }

  // Token management
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    this.isLoggedInSubject.next(true);
  }

  private removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  // User management
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private removeUser(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  private getUserFromStorage(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  // Utility methods
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'ADMIN';
  }

  isEditor(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'EDITOR';
  }

  isViewer(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'VIEWER';
  }

  hasRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }

  private loadUserProfile(): void {
    this.getProfile().subscribe({
      error: () => {
        // Token might be invalid, logout user
        this.logout();
      }
    });
  }

  private validateToken(): void {
    if (this.getToken()) {
      this.loadUserProfile();
    }
  }

  private handleError(error: any): Observable<never> {
    console.error('Auth service error:', error);
    return throwError(() => error);
  }
}