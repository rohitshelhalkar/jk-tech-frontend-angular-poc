import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { StorageService } from './storage.service';
import { environment } from '@environments/environment';
import { User, UserRole, LoginRequest, LoginResponse, RegisterRequest } from '../models/user.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let storageService: jasmine.SpyObj<StorageService>;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: UserRole.VIEWER,
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  const mockLoginResponse: LoginResponse = {
    accessToken: 'mock-jwt-token'
  };

  beforeEach(() => {
    const storageServiceSpy = jasmine.createSpyObj('StorageService', 
      ['getItem', 'setItem', 'removeItem', 'getObject', 'setObject']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: StorageService, useValue: storageServiceSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    storageService = TestBed.inject(StorageService) as jasmine.SpyObj<StorageService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should login user and store token', () => {
      const loginRequest: LoginRequest = { email: 'test@example.com', password: 'password' };
      storageService.setItem.and.returnValue(true);
      storageService.setObject.and.returnValue(true);

      service.login(loginRequest).subscribe(response => {
        expect(response).toEqual(mockLoginResponse);
      });

      // Expect login request
      const loginReq = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.auth.login}`);
      expect(loginReq.request.method).toBe('POST');
      expect(loginReq.request.body).toEqual(loginRequest);
      loginReq.flush(mockLoginResponse);

      // Expect profile request triggered by loadUserProfile
      const profileReq = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.auth.profile}`);
      expect(profileReq.request.method).toBe('GET');
      profileReq.flush(mockUser);

      expect(storageService.setItem).toHaveBeenCalledWith(environment.storage.tokenKey, mockLoginResponse.accessToken);
    });

    it('should handle login error', () => {
      const loginRequest: LoginRequest = { email: 'test@example.com', password: 'wrong' };

      service.login(loginRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.auth.login}`);
      req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('register', () => {
    it('should register new user', () => {
      const registerRequest: RegisterRequest = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password',
        role: UserRole.VIEWER
      };

      service.register(registerRequest).subscribe(user => {
        expect(user).toEqual(mockUser);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.auth.register}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(registerRequest);
      req.flush(mockUser);
    });

    it('should handle registration error', () => {
      const registerRequest: RegisterRequest = {
        name: 'New User',
        email: 'existing@example.com',
        password: 'password'
      };

      service.register(registerRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(409);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.auth.register}`);
      req.flush({ message: 'User already exists' }, { status: 409, statusText: 'Conflict' });
    });
  });

  describe('getProfile', () => {
    it('should get user profile and update state', () => {
      storageService.setObject.and.returnValue(true);

      service.getProfile().subscribe(user => {
        expect(user).toEqual(mockUser);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.auth.profile}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);

      expect(storageService.setObject).toHaveBeenCalledWith(environment.storage.userKey, mockUser);
    });
  });

  describe('logout', () => {
    it('should clear token and user data', () => {
      spyOn(service['currentUserSubject'], 'next');
      spyOn(service['isLoggedInSubject'], 'next');

      service.logout();

      expect(storageService.removeItem).toHaveBeenCalledWith(environment.storage.tokenKey);
      expect(storageService.removeItem).toHaveBeenCalledWith(environment.storage.userKey);
      expect(service['currentUserSubject'].next).toHaveBeenCalledWith(null);
      expect(service['isLoggedInSubject'].next).toHaveBeenCalledWith(false);
    });
  });

  describe('token management', () => {
    it('should get token from storage', () => {
      storageService.getItem.and.returnValue('mock-token');
      
      const token = service.getToken();
      
      expect(token).toBe('mock-token');
      expect(storageService.getItem).toHaveBeenCalledWith(environment.storage.tokenKey);
    });

    it('should return null if no token', () => {
      storageService.getItem.and.returnValue(null);
      
      const token = service.getToken();
      
      expect(token).toBeNull();
    });
  });

  describe('user role checks', () => {
    it('should check if user is admin', () => {
      spyOn(service, 'getCurrentUser').and.returnValue({...mockUser, role: UserRole.ADMIN});
      expect(service.isAdmin()).toBe(true);
      
      service.getCurrentUser = jasmine.createSpy().and.returnValue({...mockUser, role: UserRole.VIEWER});
      expect(service.isAdmin()).toBe(false);
    });

    it('should check if user is editor', () => {
      spyOn(service, 'getCurrentUser').and.returnValue({...mockUser, role: UserRole.EDITOR});
      expect(service.isEditor()).toBe(true);
      
      service.getCurrentUser = jasmine.createSpy().and.returnValue({...mockUser, role: UserRole.ADMIN});
      expect(service.isEditor()).toBe(false);
    });

    it('should check if user is viewer', () => {
      spyOn(service, 'getCurrentUser').and.returnValue({...mockUser, role: UserRole.VIEWER});
      expect(service.isViewer()).toBe(true);
      
      service.getCurrentUser = jasmine.createSpy().and.returnValue({...mockUser, role: UserRole.ADMIN});
      expect(service.isViewer()).toBe(false);
    });

    it('should check if user has specific role', () => {
      spyOn(service, 'getCurrentUser').and.returnValue({...mockUser, role: UserRole.EDITOR});
      
      expect(service.hasRole([UserRole.ADMIN, UserRole.EDITOR])).toBe(true);
      expect(service.hasRole([UserRole.ADMIN])).toBe(false);
      expect(service.hasRole([UserRole.VIEWER])).toBe(false);
    });
  });

  describe('session validation', () => {
    it('should validate session with token and user', () => {
      storageService.getItem.and.returnValue('mock-token');
      storageService.getObject.and.returnValue(mockUser);
      
      expect(service.hasValidSession()).toBe(true);
    });

    it('should invalidate session without token', () => {
      storageService.getItem.and.returnValue(null);
      storageService.getObject.and.returnValue(mockUser);
      
      expect(service.hasValidSession()).toBe(false);
    });

    it('should invalidate session without user', () => {
      storageService.getItem.and.returnValue('mock-token');
      storageService.getObject.and.returnValue(null);
      
      expect(service.hasValidSession()).toBe(false);
    });
  });
});