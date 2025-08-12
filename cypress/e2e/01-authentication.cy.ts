describe('Authentication Flow', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    cy.clearLocalStorage();
    
    // Mock successful login response
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: { accessToken: 'mock-jwt-token' }
    }).as('loginRequest');
    
    // Mock user profile response
    cy.intercept('GET', '**/api/auth/me', {
      statusCode: 200,
      body: {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN',
        active: true
      }
    }).as('profileRequest');
    
    // Mock register response
    cy.intercept('POST', '**/api/auth/register', {
      statusCode: 201,
      body: {
        id: '4',
        email: 'newuser@example.com',
        name: 'New User',
        role: 'VIEWER',
        active: true
      }
    }).as('registerRequest');
  });

  describe('Login Process', () => {
    it('should display login form correctly', () => {
      cy.visit('/auth/login');
      
      // Check page elements
      cy.get('[data-cy=login-title]').should('contain.text', 'Sign In');
      cy.get('[data-cy=email-input]').should('be.visible');
      cy.get('[data-cy=password-input]').should('be.visible');
      cy.get('[data-cy=login-button]').should('be.visible');
      cy.get('[data-cy=register-link]').should('be.visible');
      
      // Check initial state
      cy.get('[data-cy=login-button]').should('be.disabled');
    });

    it('should enable login button when form is valid', () => {
      cy.visit('/auth/login');
      
      cy.get('[data-cy=email-input]').type('admin@example.com');
      cy.get('[data-cy=password-input]').type('password123');
      
      cy.get('[data-cy=login-button]').should('not.be.disabled');
    });

    it('should show validation errors for invalid inputs', () => {
      cy.visit('/auth/login');
      
      // Test invalid email
      cy.get('[data-cy=email-input]').type('invalid-email');
      cy.get('[data-cy=password-input]').click();
      cy.get('[data-cy=email-error]').should('contain.text', 'Please enter a valid email');
      
      // Test empty password
      cy.get('[data-cy=email-input]').clear().type('valid@email.com');
      cy.get('[data-cy=password-input]').focus().blur();
      cy.get('[data-cy=password-error]').should('contain.text', 'Password is required');
    });

    it('should successfully login with valid credentials', () => {
      cy.visit('/auth/login');
      
      cy.get('[data-cy=email-input]').type('admin@example.com');
      cy.get('[data-cy=password-input]').type('password123');
      cy.get('[data-cy=login-button]').click();
      
      // Verify API calls
      cy.wait('@loginRequest').then((interception) => {
        expect(interception.request.body).to.deep.equal({
          email: 'admin@example.com',
          password: 'password123'
        });
      });
      
      cy.wait('@profileRequest');
      
      // Verify navigation to dashboard
      cy.url().should('include', '/dashboard');
      
      // Verify token storage
      cy.window().its('localStorage')
        .invoke('getItem', 'jk_tech_token')
        .should('equal', 'mock-jwt-token');
    });

    it('should handle login failure gracefully', () => {
      // Mock failed login
      cy.intercept('POST', '**/api/auth/login', {
        statusCode: 401,
        body: { message: 'Invalid credentials' }
      }).as('failedLogin');
      
      cy.visit('/auth/login');
      
      cy.get('[data-cy=email-input]').type('wrong@email.com');
      cy.get('[data-cy=password-input]').type('wrongpassword');
      cy.get('[data-cy=login-button]').click();
      
      cy.wait('@failedLogin');
      
      // Should show error message
      cy.get('[data-cy=error-message]').should('contain.text', 'Invalid credentials');
      
      // Should stay on login page
      cy.url().should('include', '/auth/login');
    });

    it('should redirect to login when accessing protected routes', () => {
      cy.visit('/dashboard');
      cy.url().should('include', '/auth/login');
      
      cy.visit('/documents');
      cy.url().should('include', '/auth/login');
      
      cy.visit('/users');
      cy.url().should('include', '/auth/login');
    });
  });

  describe('Registration Process', () => {
    it('should display registration form correctly', () => {
      cy.visit('/auth/register');
      
      // Check page elements
      cy.get('[data-cy=register-title]').should('contain.text', 'Create Account');
      cy.get('[data-cy=name-input]').should('be.visible');
      cy.get('[data-cy=email-input]').should('be.visible');
      cy.get('[data-cy=password-input]').should('be.visible');
      cy.get('[data-cy=confirm-password-input]').should('be.visible');
      cy.get('[data-cy=register-button]').should('be.visible');
      cy.get('[data-cy=login-link]').should('be.visible');
      
      // Check initial state
      cy.get('[data-cy=register-button]').should('be.disabled');
    });

    it('should validate form inputs correctly', () => {
      cy.visit('/auth/register');
      
      // Test name validation
      cy.get('[data-cy=name-input]').focus().blur();
      cy.get('[data-cy=name-error]').should('contain.text', 'Name is required');
      
      // Test email validation
      cy.get('[data-cy=email-input]').type('invalid-email').blur();
      cy.get('[data-cy=email-error]').should('contain.text', 'Please enter a valid email');
      
      // Test password validation
      cy.get('[data-cy=password-input]').type('123').blur();
      cy.get('[data-cy=password-error]').should('contain.text', 'Password must be at least 6 characters');
      
      // Test password confirmation
      cy.get('[data-cy=password-input]').clear().type('password123');
      cy.get('[data-cy=confirm-password-input]').type('different').blur();
      cy.get('[data-cy=confirm-password-error]').should('contain.text', 'Passwords do not match');
    });

    it('should successfully register new user', () => {
      cy.visit('/auth/register');
      
      cy.get('[data-cy=name-input]').type('New User');
      cy.get('[data-cy=email-input]').type('newuser@example.com');
      cy.get('[data-cy=password-input]').type('password123');
      cy.get('[data-cy=confirm-password-input]').type('password123');
      cy.get('[data-cy=register-button]').click();
      
      cy.wait('@registerRequest').then((interception) => {
        expect(interception.request.body).to.deep.equal({
          name: 'New User',
          email: 'newuser@example.com',
          password: 'password123'
        });
      });
      
      // Should show success message
      cy.get('[data-cy=success-message]').should('contain.text', 'Registration successful');
      
      // Should redirect to login
      cy.url().should('include', '/auth/login');
    });

    it('should handle registration failure', () => {
      // Mock failed registration
      cy.intercept('POST', '**/api/auth/register', {
        statusCode: 409,
        body: { message: 'User already exists' }
      }).as('failedRegister');
      
      cy.visit('/auth/register');
      
      cy.get('[data-cy=name-input]').type('Existing User');
      cy.get('[data-cy=email-input]').type('existing@example.com');
      cy.get('[data-cy=password-input]').type('password123');
      cy.get('[data-cy=confirm-password-input]').type('password123');
      cy.get('[data-cy=register-button]').click();
      
      cy.wait('@failedRegister');
      
      // Should show error message
      cy.get('[data-cy=error-message]').should('contain.text', 'User already exists');
      
      // Should stay on register page
      cy.url().should('include', '/auth/register');
    });
  });

  describe('Logout Process', () => {
    beforeEach(() => {
      // Login before each logout test
      cy.visit('/auth/login');
      cy.get('[data-cy=email-input]').type('admin@example.com');
      cy.get('[data-cy=password-input]').type('password123');
      cy.get('[data-cy=login-button]').click();
      cy.wait('@loginRequest');
      cy.wait('@profileRequest');
      cy.url().should('include', '/dashboard');
    });

    it('should successfully logout user', () => {
      // Open user menu and logout
      cy.get('[data-cy=user-menu-button]').click();
      cy.get('[data-cy=logout-button]').click();
      
      // Should redirect to login
      cy.url().should('include', '/auth/login');
      
      // Should clear localStorage
      cy.window().its('localStorage')
        .invoke('getItem', 'jk_tech_token')
        .should('be.null');
    });

    it('should redirect to login when token expires', () => {
      // Mock token expiry by intercepting next API call with 401
      cy.intercept('GET', '**/api/**', {
        statusCode: 401,
        body: { message: 'Token expired' }
      }).as('tokenExpired');
      
      // Navigate to documents to trigger API call
      cy.visit('/documents');
      
      cy.wait('@tokenExpired');
      
      // Should redirect to login
      cy.url().should('include', '/auth/login');
    });
  });

  describe('Session Persistence', () => {
    it('should maintain session across browser refresh', () => {
      // Login
      cy.visit('/auth/login');
      cy.get('[data-cy=email-input]').type('admin@example.com');
      cy.get('[data-cy=password-input]').type('password123');
      cy.get('[data-cy=login-button]').click();
      cy.wait('@loginRequest');
      cy.wait('@profileRequest');
      
      // Navigate to documents
      cy.visit('/documents');
      cy.url().should('include', '/documents');
      
      // Refresh page
      cy.reload();
      
      // Should stay on documents page (session persisted)
      cy.url().should('include', '/documents');
    });

    it('should handle invalid token in localStorage', () => {
      // Set invalid token
      cy.window().its('localStorage').invoke('setItem', 'jk_tech_token', 'invalid-token');
      
      // Mock 401 response for profile request
      cy.intercept('GET', '**/api/auth/me', {
        statusCode: 401,
        body: { message: 'Invalid token' }
      }).as('invalidToken');
      
      cy.visit('/dashboard');
      
      cy.wait('@invalidToken');
      
      // Should redirect to login
      cy.url().should('include', '/auth/login');
    });
  });

  describe('Navigation Links', () => {
    it('should navigate between login and register pages', () => {
      cy.visit('/auth/login');
      
      // Go to register
      cy.get('[data-cy=register-link]').click();
      cy.url().should('include', '/auth/register');
      
      // Go back to login
      cy.get('[data-cy=login-link]').click();
      cy.url().should('include', '/auth/login');
    });
  });

  describe('Responsive Design', () => {
    const viewports = [
      { width: 375, height: 667, device: 'mobile' },
      { width: 768, height: 1024, device: 'tablet' },
      { width: 1280, height: 720, device: 'desktop' }
    ];

    viewports.forEach(({ width, height, device }) => {
      it(`should display correctly on ${device}`, () => {
        cy.viewport(width, height);
        cy.visit('/auth/login');
        
        // Check form is visible and usable
        cy.get('[data-cy=login-form]').should('be.visible');
        cy.get('[data-cy=email-input]').should('be.visible');
        cy.get('[data-cy=password-input]').should('be.visible');
        cy.get('[data-cy=login-button]').should('be.visible');
        
        // Test input interaction
        cy.get('[data-cy=email-input]').type('test@example.com');
        cy.get('[data-cy=password-input]').type('password');
        cy.get('[data-cy=login-button]').should('not.be.disabled');
      });
    });
  });
});