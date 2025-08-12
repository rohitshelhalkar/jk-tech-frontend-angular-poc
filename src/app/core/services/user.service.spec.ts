import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { environment } from '@environments/environment';
import { 
  User, 
  UserRole, 
  CreateUserRequest, 
  UpdateUserRequest 
} from '../models/user.model';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: UserRole.VIEWER,
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  const mockAdminUser: User = {
    id: '2',
    email: 'admin@example.com',
    name: 'Admin User',
    role: UserRole.ADMIN,
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  const mockEditorUser: User = {
    id: '3',
    email: 'editor@example.com',
    name: 'Editor User',
    role: UserRole.EDITOR,
    active: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService]
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getUsers', () => {
    it('should get all users', () => {
      const mockUsers = [mockUser, mockAdminUser, mockEditorUser];

      service.getUsers().subscribe(users => {
        expect(users).toEqual(mockUsers);
        expect(users.length).toBe(3);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.users}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUsers);
    });

    it('should return empty array when no users exist', () => {
      service.getUsers().subscribe(users => {
        expect(users).toEqual([]);
        expect(users.length).toBe(0);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.users}`);
      req.flush([]);
    });

    it('should handle get users error', () => {
      service.getUsers().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(403);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.users}`);
      req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });
    });
  });

  describe('getUser', () => {
    it('should get user by id', () => {
      service.getUser('1').subscribe(user => {
        expect(user).toEqual(mockUser);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.users}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);
    });

    it('should handle user not found', () => {
      service.getUser('999').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.users}/999`);
      req.flush({ message: 'User not found' }, { status: 404, statusText: 'Not Found' });
    });

    it('should handle authorization error', () => {
      service.getUser('1').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(403);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.users}/1`);
      req.flush({ message: 'Access denied' }, { status: 403, statusText: 'Forbidden' });
    });
  });

  describe('createUser', () => {
    it('should create user with all fields', () => {
      const createRequest: CreateUserRequest = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
        role: UserRole.EDITOR
      };

      const newUser: User = {
        id: '4',
        email: 'new@example.com',
        name: 'New User',
        role: UserRole.EDITOR,
        active: true,
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      };

      service.createUser(createRequest).subscribe(user => {
        expect(user).toEqual(newUser);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.auth.register}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createRequest);
      req.flush(newUser);
    });

    it('should create user without role (default to VIEWER)', () => {
      const createRequest: CreateUserRequest = {
        name: 'New Viewer',
        email: 'viewer@example.com',
        password: 'password123'
      };

      const newUser: User = {
        id: '5',
        email: 'viewer@example.com',
        name: 'New Viewer',
        role: UserRole.VIEWER,
        active: true,
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      };

      service.createUser(createRequest).subscribe(user => {
        expect(user).toEqual(newUser);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.auth.register}`);
      expect(req.request.body).toEqual(createRequest);
      req.flush(newUser);
    });

    it('should handle user creation error - email exists', () => {
      const createRequest: CreateUserRequest = {
        name: 'Duplicate User',
        email: 'existing@example.com',
        password: 'password123'
      };

      service.createUser(createRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(409);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.auth.register}`);
      req.flush({ message: 'User already exists' }, { status: 409, statusText: 'Conflict' });
    });

    it('should handle validation errors', () => {
      const createRequest: CreateUserRequest = {
        name: '',
        email: 'invalid-email',
        password: '123'
      };

      service.createUser(createRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.auth.register}`);
      req.flush({ 
        message: 'Validation failed',
        errors: ['Name is required', 'Invalid email format', 'Password too short']
      }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('updateUser', () => {
    it('should update user with all fields', () => {
      const updateRequest: UpdateUserRequest = {
        name: 'Updated Name',
        email: 'updated@example.com',
        role: UserRole.ADMIN,
        active: false
      };

      const updatedUser: User = {
        ...mockUser,
        ...updateRequest,
        updatedAt: '2024-01-02T00:00:00Z'
      };

      service.updateUser('1', updateRequest).subscribe(user => {
        expect(user).toEqual(updatedUser);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.users}/1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(updateRequest);
      req.flush(updatedUser);
    });

    it('should update user with partial data', () => {
      const updateRequest: UpdateUserRequest = {
        name: 'New Name Only'
      };

      const updatedUser: User = {
        ...mockUser,
        name: 'New Name Only',
        updatedAt: '2024-01-02T00:00:00Z'
      };

      service.updateUser('1', updateRequest).subscribe(user => {
        expect(user).toEqual(updatedUser);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.users}/1`);
      expect(req.request.body).toEqual(updateRequest);
      req.flush(updatedUser);
    });

    it('should handle update error - user not found', () => {
      const updateRequest: UpdateUserRequest = {
        name: 'Updated Name'
      };

      service.updateUser('999', updateRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.users}/999`);
      req.flush({ message: 'User not found' }, { status: 404, statusText: 'Not Found' });
    });

    it('should handle update error - email conflict', () => {
      const updateRequest: UpdateUserRequest = {
        email: 'existing@example.com'
      };

      service.updateUser('1', updateRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(409);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.users}/1`);
      req.flush({ message: 'Email already exists' }, { status: 409, statusText: 'Conflict' });
    });
  });

  describe('deleteUser', () => {
    it('should delete user', () => {
      const deleteResponse = { message: 'User deleted successfully' };

      service.deleteUser('1').subscribe(response => {
        expect(response).toEqual(deleteResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.users}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(deleteResponse);
    });

    it('should handle delete error - user not found', () => {
      service.deleteUser('999').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.users}/999`);
      req.flush({ message: 'User not found' }, { status: 404, statusText: 'Not Found' });
    });

    it('should handle delete error - forbidden operation', () => {
      service.deleteUser('1').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(403);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.users}/1`);
      req.flush({ message: 'Cannot delete yourself' }, { status: 403, statusText: 'Forbidden' });
    });
  });

  describe('activateUser', () => {
    it('should activate user', () => {
      const activatedUser: User = {
        ...mockEditorUser,
        active: true,
        updatedAt: '2024-01-02T00:00:00Z'
      };

      service.activateUser('3').subscribe(user => {
        expect(user).toEqual(activatedUser);
        expect(user.active).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.users}/3`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ active: true });
      req.flush(activatedUser);
    });

    it('should handle activation error', () => {
      service.activateUser('999').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.users}/999`);
      req.flush({ message: 'User not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user', () => {
      const deactivatedUser: User = {
        ...mockUser,
        active: false,
        updatedAt: '2024-01-02T00:00:00Z'
      };

      service.deactivateUser('1').subscribe(user => {
        expect(user).toEqual(deactivatedUser);
        expect(user.active).toBe(false);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.users}/1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ active: false });
      req.flush(deactivatedUser);
    });

    it('should handle deactivation error', () => {
      service.deactivateUser('999').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.users}/999`);
      req.flush({ message: 'User not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('changeUserRole', () => {
    it('should change user role to ADMIN', () => {
      const roleChangedUser: User = {
        ...mockUser,
        role: UserRole.ADMIN,
        updatedAt: '2024-01-02T00:00:00Z'
      };

      service.changeUserRole('1', UserRole.ADMIN).subscribe(user => {
        expect(user).toEqual(roleChangedUser);
        expect(user.role).toBe(UserRole.ADMIN);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.users}/1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ role: UserRole.ADMIN });
      req.flush(roleChangedUser);
    });

    it('should change user role to EDITOR', () => {
      const roleChangedUser: User = {
        ...mockUser,
        role: UserRole.EDITOR,
        updatedAt: '2024-01-02T00:00:00Z'
      };

      service.changeUserRole('1', UserRole.EDITOR).subscribe(user => {
        expect(user).toEqual(roleChangedUser);
        expect(user.role).toBe(UserRole.EDITOR);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.users}/1`);
      expect(req.request.body).toEqual({ role: UserRole.EDITOR });
      req.flush(roleChangedUser);
    });

    it('should change user role to VIEWER', () => {
      const roleChangedUser: User = {
        ...mockAdminUser,
        role: UserRole.VIEWER,
        updatedAt: '2024-01-02T00:00:00Z'
      };

      service.changeUserRole('2', UserRole.VIEWER).subscribe(user => {
        expect(user).toEqual(roleChangedUser);
        expect(user.role).toBe(UserRole.VIEWER);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.users}/2`);
      expect(req.request.body).toEqual({ role: UserRole.VIEWER });
      req.flush(roleChangedUser);
    });

    it('should handle role change error', () => {
      service.changeUserRole('999', UserRole.ADMIN).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.users}/999`);
      req.flush({ message: 'User not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('error handling', () => {
    it('should handle network errors', () => {
      spyOn(console, 'error');

      service.getUsers().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeDefined();
          expect(console.error).toHaveBeenCalledWith('User service error:', error);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.users}`);
      req.error(new ErrorEvent('Network error'));
    });

    it('should handle server errors', () => {
      spyOn(console, 'error');

      service.getUser('1').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(console.error).toHaveBeenCalledWith('User service error:', error);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.users}/1`);
      req.flush({ message: 'Internal Server Error' }, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle authentication errors', () => {
      spyOn(console, 'error');

      service.getUsers().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
          expect(console.error).toHaveBeenCalledWith('User service error:', error);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.users}`);
      req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('edge cases', () => {
    it('should handle empty user data in update', () => {
      const updateRequest: UpdateUserRequest = {};

      service.updateUser('1', updateRequest).subscribe(user => {
        expect(user).toEqual(mockUser);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.users}/1`);
      expect(req.request.body).toEqual({});
      req.flush(mockUser);
    });

    it('should handle special characters in user data', () => {
      const updateRequest: UpdateUserRequest = {
        name: 'Üser Naïme',
        email: 'üser@exämple.com'
      };

      const updatedUser: User = {
        ...mockUser,
        ...updateRequest,
        updatedAt: '2024-01-02T00:00:00Z'
      };

      service.updateUser('1', updateRequest).subscribe(user => {
        expect(user).toEqual(updatedUser);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.users}/1`);
      expect(req.request.body).toEqual(updateRequest);
      req.flush(updatedUser);
    });

    it('should handle long user names and emails', () => {
      const longName = 'A'.repeat(100);
      const longEmail = 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com';
      
      const updateRequest: UpdateUserRequest = {
        name: longName,
        email: longEmail
      };

      const updatedUser: User = {
        ...mockUser,
        ...updateRequest,
        updatedAt: '2024-01-02T00:00:00Z'
      };

      service.updateUser('1', updateRequest).subscribe(user => {
        expect(user).toEqual(updatedUser);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.users}/1`);
      expect(req.request.body).toEqual(updateRequest);
      req.flush(updatedUser);
    });
  });
});