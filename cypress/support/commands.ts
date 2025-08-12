/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login as user
       * @example cy.login('admin@example.com', 'password')
       */
      login(email: string, password: string): Chainable<void>
      
      /**
       * Custom command to login as specific user role
       * @example cy.loginAs('admin')
       */
      loginAs(role: 'admin' | 'editor' | 'viewer'): Chainable<void>
      
      /**
       * Custom command to logout current user
       * @example cy.logout()
       */
      logout(): Chainable<void>
      
      /**
       * Custom command to intercept API calls
       * @example cy.mockApiResponse('GET', '/api/users', { fixture: 'users.json' })
       */
      mockApiResponse(method: string, url: string, response: any): Chainable<void>
      
      /**
       * Custom command to wait for page to load
       * @example cy.waitForPageLoad()
       */
      waitForPageLoad(): Chainable<void>
      
      /**
       * Custom command to upload file
       * @example cy.uploadFile('input[type=file]', 'test-document.pdf')
       */
      uploadFile(selector: string, fileName: string): Chainable<void>
    }
  }
}

// Login command
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/auth/login');
    cy.get('[data-cy=email-input]').type(email);
    cy.get('[data-cy=password-input]').type(password);
    cy.get('[data-cy=login-button]').click();
    cy.url().should('not.include', '/auth/login');
    cy.window().its('localStorage').invoke('getItem', 'jk_tech_token').should('exist');
  });
});

// Login as specific role
Cypress.Commands.add('loginAs', (role: 'admin' | 'editor' | 'viewer') => {
  const credentials = {
    admin: { email: 'admin@example.com', password: 'password123' },
    editor: { email: 'editor@example.com', password: 'password123' },
    viewer: { email: 'viewer@example.com', password: 'password123' }
  };
  
  const { email, password } = credentials[role];
  cy.login(email, password);
});

// Logout command
Cypress.Commands.add('logout', () => {
  cy.get('[data-cy=user-menu-button]').click();
  cy.get('[data-cy=logout-button]').click();
  cy.url().should('include', '/auth/login');
  cy.window().its('localStorage').invoke('getItem', 'jk_tech_token').should('not.exist');
});

// Mock API response
Cypress.Commands.add('mockApiResponse', (method: string, url: string, response: any) => {
  cy.intercept(method, `**/api${url}`, response).as(`${method.toLowerCase()}${url.replace(/\//g, '_')}`);
});

// Wait for page load
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('[data-cy=loading-spinner]', { timeout: 1000 }).should('not.exist');
  cy.get('body').should('be.visible');
});

// Upload file command
Cypress.Commands.add('uploadFile', (selector: string, fileName: string) => {
  cy.fixture(fileName, 'base64').then((content) => {
    const blob = Cypress.Blob.base64StringToBlob(content);
    const file = new File([blob], fileName, { type: 'application/pdf' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    
    cy.get(selector).then((input) => {
      const el = input[0] as HTMLInputElement;
      el.files = dataTransfer.files;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });
});

export {};