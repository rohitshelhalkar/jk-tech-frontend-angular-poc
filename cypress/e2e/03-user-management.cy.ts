describe('User Management', () => {
  beforeEach(() => {
    // Setup authentication as admin
    cy.loginAs('admin');
    
    // Mock users API responses
    cy.fixture('users').then((usersData) => {
      cy.intercept('GET', '**/api/users', {
        statusCode: 200,
        body: usersData
      }).as('getUsers');
    });
    
    // Mock individual user response
    cy.intercept('GET', '**/api/users/1', {
      statusCode: 200,
      body: {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN',
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    }).as('getUser');
    
    // Mock create user response
    cy.intercept('POST', '**/api/auth/register', {
      statusCode: 201,
      body: {
        id: '4',
        email: 'newuser@example.com',
        name: 'New User',
        role: 'VIEWER',
        active: true,
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      }
    }).as('createUser');
    
    // Mock update user response
    cy.intercept('PATCH', '**/api/users/2', {
      statusCode: 200,
      body: {
        id: '2',
        email: 'editor@example.com',
        name: 'Updated Editor',
        role: 'ADMIN',
        active: false,
        updatedAt: '2024-01-02T00:00:00Z'
      }
    }).as('updateUser');
    
    // Mock delete user response
    cy.intercept('DELETE', '**/api/users/3', {
      statusCode: 200,
      body: { message: 'User deleted successfully' }
    }).as('deleteUser');
  });

  describe('User List View', () => {
    it('should display users list correctly', () => {
      cy.visit('/users');
      cy.wait('@getUsers');
      
      // Check page title
      cy.get('[data-cy=page-title]').should('contain.text', 'User Management');
      
      // Check add user button (admin only)
      cy.get('[data-cy=add-user-button]').should('be.visible');
      
      // Check users table
      cy.get('[data-cy=users-table]').should('be.visible');
      cy.get('[data-cy=user-row]').should('have.length', 3);
      
      // Check first user details
      cy.get('[data-cy=user-row]').first().within(() => {
        cy.get('[data-cy=user-name]').should('contain.text', 'Admin User');
        cy.get('[data-cy=user-email]').should('contain.text', 'admin@example.com');
        cy.get('[data-cy=user-role]').should('contain.text', 'ADMIN');
        cy.get('[data-cy=user-status]').should('contain.text', 'Active');
        cy.get('[data-cy=user-actions]').should('be.visible');
      });
    });

    it('should filter users by role', () => {
      cy.visit('/users');
      cy.wait('@getUsers');
      
      // Open role filter
      cy.get('[data-cy=role-filter]').click();
      cy.get('[data-cy=role-option-admin]').click();
      
      // Should filter to show only admin users
      cy.get('[data-cy=user-row]').should('have.length', 1);
      cy.get('[data-cy=user-role]').should('contain.text', 'ADMIN');
    });

    it('should filter users by status', () => {
      cy.visit('/users');
      cy.wait('@getUsers');
      
      // Open status filter
      cy.get('[data-cy=status-filter]').click();
      cy.get('[data-cy=status-option-inactive]').click();
      
      // Should filter to show only inactive users
      cy.get('[data-cy=user-row]').should('have.length', 0);
      cy.get('[data-cy=empty-message]').should('contain.text', 'No inactive users found');
    });

    it('should search users by name or email', () => {
      cy.visit('/users');
      cy.wait('@getUsers');
      
      // Search by name
      cy.get('[data-cy=search-input]').type('Admin');
      cy.get('[data-cy=user-row]').should('have.length', 1);
      cy.get('[data-cy=user-name]').should('contain.text', 'Admin User');
      
      // Clear and search by email
      cy.get('[data-cy=search-input]').clear().type('editor@');
      cy.get('[data-cy=user-row]').should('have.length', 1);
      cy.get('[data-cy=user-email]').should('contain.text', 'editor@example.com');
    });

    it('should handle empty state', () => {
      // Mock empty response
      cy.intercept('GET', '**/api/users', {
        statusCode: 200,
        body: []
      }).as('getEmptyUsers');
      
      cy.visit('/users');
      cy.wait('@getEmptyUsers');
      
      // Check empty state
      cy.get('[data-cy=empty-state]').should('be.visible');
      cy.get('[data-cy=empty-message]').should('contain.text', 'No users found');
      cy.get('[data-cy=add-user-button]').should('be.visible');
    });
  });

  describe('Create User', () => {
    it('should open create user dialog', () => {
      cy.visit('/users');
      cy.wait('@getUsers');
      
      cy.get('[data-cy=add-user-button]').click();
      
      // Check create user dialog
      cy.get('[data-cy=user-dialog]').should('be.visible');
      cy.get('[data-cy=dialog-title]').should('contain.text', 'Create New User');
      cy.get('[data-cy=name-input]').should('be.visible');
      cy.get('[data-cy=email-input]').should('be.visible');
      cy.get('[data-cy=password-input]').should('be.visible');
      cy.get('[data-cy=role-select]').should('be.visible');
      cy.get('[data-cy=save-button]').should('be.disabled');
    });

    it('should validate form inputs', () => {
      cy.visit('/users');
      cy.get('[data-cy=add-user-button]').click();
      
      // Test required fields
      cy.get('[data-cy=name-input]').focus().blur();
      cy.get('[data-cy=name-error]').should('contain.text', 'Name is required');
      
      cy.get('[data-cy=email-input]').focus().blur();
      cy.get('[data-cy=email-error]').should('contain.text', 'Email is required');
      
      cy.get('[data-cy=password-input]').focus().blur();
      cy.get('[data-cy=password-error]').should('contain.text', 'Password is required');
      
      // Test email format
      cy.get('[data-cy=email-input]').type('invalid-email');
      cy.get('[data-cy=password-input]').focus();
      cy.get('[data-cy=email-error]').should('contain.text', 'Please enter a valid email');
      
      // Test password length
      cy.get('[data-cy=password-input]').type('123');
      cy.get('[data-cy=name-input]').focus();
      cy.get('[data-cy=password-error]').should('contain.text', 'Password must be at least 6 characters');
    });

    it('should successfully create new user', () => {
      cy.visit('/users');
      cy.get('[data-cy=add-user-button]').click();
      
      // Fill form
      cy.get('[data-cy=name-input]').type('New User');
      cy.get('[data-cy=email-input]').type('newuser@example.com');
      cy.get('[data-cy=password-input]').type('password123');
      cy.get('[data-cy=role-select]').click();
      cy.get('[data-cy=role-option-editor]').click();
      
      // Submit form
      cy.get('[data-cy=save-button]').should('not.be.disabled');
      cy.get('[data-cy=save-button]').click();
      
      cy.wait('@createUser').then((interception) => {
        expect(interception.request.body).to.deep.include({
          name: 'New User',
          email: 'newuser@example.com',
          password: 'password123',
          role: 'EDITOR'
        });
      });
      
      // Should close dialog and show success
      cy.get('[data-cy=user-dialog]').should('not.exist');
      cy.get('[data-cy=success-message]').should('contain.text', 'User created successfully');
      
      // Should refresh users list
      cy.wait('@getUsers');
    });

    it('should handle create user failure', () => {
      // Mock creation failure
      cy.intercept('POST', '**/api/auth/register', {
        statusCode: 409,
        body: { message: 'User already exists' }
      }).as('createUserFailed');
      
      cy.visit('/users');
      cy.get('[data-cy=add-user-button]').click();
      
      cy.get('[data-cy=name-input]').type('Existing User');
      cy.get('[data-cy=email-input]').type('existing@example.com');
      cy.get('[data-cy=password-input]').type('password123');
      cy.get('[data-cy=save-button]').click();
      
      cy.wait('@createUserFailed');
      
      // Should show error message
      cy.get('[data-cy=error-message]').should('contain.text', 'User already exists');
      
      // Dialog should remain open
      cy.get('[data-cy=user-dialog]').should('be.visible');
    });

    it('should cancel user creation', () => {
      cy.visit('/users');
      cy.get('[data-cy=add-user-button]').click();
      
      // Fill some data
      cy.get('[data-cy=name-input]').type('Test User');
      
      // Cancel
      cy.get('[data-cy=cancel-button]').click();
      
      // Dialog should close
      cy.get('[data-cy=user-dialog]').should('not.exist');
    });
  });

  describe('Edit User', () => {
    it('should open edit user dialog with existing data', () => {
      cy.visit('/users');
      cy.wait('@getUsers');
      
      cy.get('[data-cy=user-row]').eq(1).within(() => {
        cy.get('[data-cy=edit-button]').click();
      });
      
      // Check edit dialog
      cy.get('[data-cy=user-dialog]').should('be.visible');
      cy.get('[data-cy=dialog-title]').should('contain.text', 'Edit User');
      
      // Check pre-filled data
      cy.get('[data-cy=name-input]').should('have.value', 'Editor User');
      cy.get('[data-cy=email-input]').should('have.value', 'editor@example.com');
      cy.get('[data-cy=role-select]').should('contain.text', 'EDITOR');
      cy.get('[data-cy=status-toggle]').should('be.checked');
      
      // Password field should not be visible in edit mode
      cy.get('[data-cy=password-input]').should('not.exist');
    });

    it('should successfully update user', () => {
      cy.visit('/users');
      cy.wait('@getUsers');
      
      cy.get('[data-cy=user-row]').eq(1).within(() => {
        cy.get('[data-cy=edit-button]').click();
      });
      
      // Update fields
      cy.get('[data-cy=name-input]').clear().type('Updated Editor');
      cy.get('[data-cy=role-select]').click();
      cy.get('[data-cy=role-option-admin]').click();
      cy.get('[data-cy=status-toggle]').uncheck();
      
      // Submit changes
      cy.get('[data-cy=save-button]').click();
      
      cy.wait('@updateUser').then((interception) => {
        expect(interception.request.body).to.deep.include({
          name: 'Updated Editor',
          role: 'ADMIN',
          active: false
        });
      });
      
      // Should close dialog and show success
      cy.get('[data-cy=user-dialog]').should('not.exist');
      cy.get('[data-cy=success-message]').should('contain.text', 'User updated successfully');
      
      // Should refresh users list
      cy.wait('@getUsers');
    });

    it('should handle edit user failure', () => {
      // Mock update failure
      cy.intercept('PATCH', '**/api/users/2', {
        statusCode: 409,
        body: { message: 'Email already exists' }
      }).as('updateUserFailed');
      
      cy.visit('/users');
      cy.wait('@getUsers');
      
      cy.get('[data-cy=user-row]').eq(1).within(() => {
        cy.get('[data-cy=edit-button]').click();
      });
      
      cy.get('[data-cy=email-input]').clear().type('admin@example.com');
      cy.get('[data-cy=save-button]').click();
      
      cy.wait('@updateUserFailed');
      
      // Should show error message
      cy.get('[data-cy=error-message]').should('contain.text', 'Email already exists');
      
      // Dialog should remain open
      cy.get('[data-cy=user-dialog]').should('be.visible');
    });
  });

  describe('User Actions', () => {
    beforeEach(() => {
      cy.visit('/users');
      cy.wait('@getUsers');
    });

    it('should activate/deactivate user', () => {
      // Mock activate response
      cy.intercept('PATCH', '**/api/users/3', {
        statusCode: 200,
        body: {
          id: '3',
          email: 'viewer@example.com',
          name: 'Viewer User',
          role: 'VIEWER',
          active: false,
          updatedAt: '2024-01-02T00:00:00Z'
        }
      }).as('toggleUserStatus');
      
      cy.get('[data-cy=user-row]').eq(2).within(() => {
        cy.get('[data-cy=status-toggle]').click();
      });
      
      cy.wait('@toggleUserStatus');
      
      // Should show success message
      cy.get('[data-cy=success-message]').should('contain.text', 'User status updated');
    });

    it('should change user role', () => {
      cy.get('[data-cy=user-row]').eq(2).within(() => {
        cy.get('[data-cy=role-select]').click();
      });
      
      cy.get('[data-cy=role-option-editor]').click();
      
      cy.wait('@updateUser');
      
      // Should show success message
      cy.get('[data-cy=success-message]').should('contain.text', 'User role updated');
    });

    it('should delete user with confirmation', () => {
      cy.get('[data-cy=user-row]').eq(2).within(() => {
        cy.get('[data-cy=delete-button]').click();
      });
      
      // Check confirmation dialog
      cy.get('[data-cy=confirm-dialog]').should('be.visible');
      cy.get('[data-cy=confirm-message]').should('contain.text', 'Are you sure you want to delete this user?');
      
      // Cancel first
      cy.get('[data-cy=cancel-button]').click();
      cy.get('[data-cy=confirm-dialog]').should('not.exist');
      
      // Try again and confirm
      cy.get('[data-cy=user-row]').eq(2).within(() => {
        cy.get('[data-cy=delete-button]').click();
      });
      cy.get('[data-cy=confirm-button]').click();
      
      cy.wait('@deleteUser');
      
      // Should show success and refresh list
      cy.get('[data-cy=success-message]').should('contain.text', 'User deleted successfully');
      cy.wait('@getUsers');
    });

    it('should prevent admin from deleting themselves', () => {
      cy.get('[data-cy=user-row]').first().within(() => {
        // Delete button should not exist for current user
        cy.get('[data-cy=delete-button]').should('not.exist');
      });
    });
  });

  describe('Role-based Access Control', () => {
    it('should show different permissions for editor role', () => {
      // Login as editor
      cy.loginAs('editor');
      
      cy.visit('/users');
      
      // Editors should not see user management page
      cy.url().should('not.include', '/users');
      cy.url().should('include', '/dashboard');
    });

    it('should show different permissions for viewer role', () => {
      // Login as viewer
      cy.loginAs('viewer');
      
      cy.visit('/users');
      
      // Viewers should not see user management page
      cy.url().should('not.include', '/users');
      cy.url().should('include', '/dashboard');
    });

    it('should hide user management menu for non-admin users', () => {
      cy.loginAs('editor');
      cy.visit('/dashboard');
      
      // User management menu should not be visible
      cy.get('[data-cy=users-menu]').should('not.exist');
    });
  });

  describe('User Status Indicators', () => {
    it('should display correct status badges', () => {
      cy.visit('/users');
      cy.wait('@getUsers');
      
      // Check active status
      cy.get('[data-cy=user-row]').first().within(() => {
        cy.get('[data-cy=status-badge]').should('have.class', 'status-active');
        cy.get('[data-cy=status-badge]').should('contain.text', 'Active');
      });
      
      // Mock inactive user
      cy.intercept('GET', '**/api/users', {
        statusCode: 200,
        body: [
          {
            id: '1',
            email: 'inactive@example.com',
            name: 'Inactive User',
            role: 'VIEWER',
            active: false
          }
        ]
      }).as('getInactiveUser');
      
      cy.reload();
      cy.wait('@getInactiveUser');
      
      // Check inactive status
      cy.get('[data-cy=user-row]').first().within(() => {
        cy.get('[data-cy=status-badge]').should('have.class', 'status-inactive');
        cy.get('[data-cy=status-badge]').should('contain.text', 'Inactive');
      });
    });
  });

  describe('Responsive Design', () => {
    it('should work correctly on mobile devices', () => {
      cy.viewport(375, 667);
      cy.visit('/users');
      cy.wait('@getUsers');
      
      // Check mobile layout
      cy.get('[data-cy=users-table]').should('be.visible');
      cy.get('[data-cy=add-user-button]').should('be.visible');
      
      // Check mobile card layout
      cy.get('[data-cy=user-card]').should('be.visible');
      
      // Test mobile actions menu
      cy.get('[data-cy=user-card]').first().within(() => {
        cy.get('[data-cy=mobile-actions]').click();
      });
      
      cy.get('[data-cy=mobile-menu]').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', () => {
      cy.visit('/users');
      cy.wait('@getUsers');
      
      // Test tab navigation
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-cy', 'add-user-button');
      
      // Test table navigation
      cy.get('[data-cy=users-table]').focus();
      cy.focused().type('{downarrow}');
      
      // Test dialog keyboard navigation
      cy.get('[data-cy=add-user-button]').click();
      cy.get('[data-cy=name-input]').should('be.focused');
    });

    it('should have proper ARIA labels', () => {
      cy.visit('/users');
      cy.wait('@getUsers');
      
      // Check ARIA labels
      cy.get('[data-cy=users-table]').should('have.attr', 'aria-label', 'Users table');
      cy.get('[data-cy=add-user-button]').should('have.attr', 'aria-label', 'Add new user');
      cy.get('[data-cy=search-input]').should('have.attr', 'aria-label', 'Search users');
    });
  });

  describe('Data Validation', () => {
    it('should prevent duplicate emails', () => {
      cy.visit('/users');
      cy.get('[data-cy=add-user-button]').click();
      
      // Try to create user with existing email
      cy.get('[data-cy=name-input]').type('Duplicate User');
      cy.get('[data-cy=email-input]').type('admin@example.com');
      cy.get('[data-cy=password-input]').type('password123');
      
      // Should show validation error
      cy.get('[data-cy=email-error]').should('contain.text', 'Email already exists');
      cy.get('[data-cy=save-button]').should('be.disabled');
    });

    it('should validate email format in real-time', () => {
      cy.visit('/users');
      cy.get('[data-cy=add-user-button]').click();
      
      // Type invalid email
      cy.get('[data-cy=email-input]').type('invalid-email');
      cy.get('[data-cy=name-input]').focus();
      
      // Should show format error
      cy.get('[data-cy=email-error]').should('contain.text', 'Please enter a valid email');
      
      // Type valid email
      cy.get('[data-cy=email-input]').clear().type('valid@email.com');
      cy.get('[data-cy=name-input]').focus();
      
      // Error should disappear
      cy.get('[data-cy=email-error]').should('not.exist');
    });
  });
});