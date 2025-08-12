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
import { StorageService } from './storage.service';

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

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {
    // Initialize the auth state from localStorage
    this.initializeAuthState();
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

  // Method to manually refresh auth state from storage (useful for debugging)
  refreshAuthFromStorage(): void {
    this.initializeAuthState();
  }

  // Method to check if we have valid session data
  hasValidSession(): boolean {
    return !!(this.getToken() && this.getUserFromStorage());
  }

  // Debug method to check storage state
  debugAuthState(): void {
    console.group('🔐 Authentication State Debug');
    console.log('Token exists:', !!this.getToken());
    console.log('Token value:', this.getToken()?.substring(0, 20) + '...');
    console.log('User exists:', !!this.getUserFromStorage());
    console.log('User value:', this.getUserFromStorage());
    console.log('Current user subject:', this.currentUserSubject.value);
    console.log('Is logged in subject:', this.isLoggedInSubject.value);
    console.log('Has valid session:', this.hasValidSession());
    console.groupEnd();
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
    return this.storageService.getItem(this.TOKEN_KEY);
  }

  private setToken(token: string): void {
    if (this.storageService.setItem(this.TOKEN_KEY, token)) {
      this.isLoggedInSubject.next(true);
      console.log('Token stored successfully');
    } else {
      console.error('Failed to store token');
    }
  }

  private removeToken(): void {
    this.storageService.removeItem(this.TOKEN_KEY);
  }

  // User management
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private setUser(user: User): void {
    if (this.storageService.setObject(this.USER_KEY, user)) {
      this.currentUserSubject.next(user);
      console.log('User data stored successfully');
    } else {
      console.error('Failed to store user data');
    }
  }

  private removeUser(): void {
    this.storageService.removeItem(this.USER_KEY);
  }

  private getUserFromStorage(): User | null {
    return this.storageService.getObject<User>(this.USER_KEY);
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
      error: (error) => {
        console.error('Failed to load user profile:', error);
        // Only logout on authentication errors (401/403), not network errors
        if (error.status === 401 || error.status === 403) {
          this.logout();
        }
      }
    });
  }

  private initializeAuthState(): void {
    const token = this.getToken();
    const user = this.getUserFromStorage();
    
    if (token && user) {
      // We have both token and user, set the state and validate
      this.currentUserSubject.next(user);
      this.isLoggedInSubject.next(true);
      this.validateToken();
    } else if (token) {
      // We have token but no user, try to load profile
      this.loadUserProfile();
    } else {
      // No token, ensure we're logged out
      this.logout();
    }
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