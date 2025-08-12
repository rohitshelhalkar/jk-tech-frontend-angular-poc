/// <reference types="cypress" />

declare namespace Cypress {
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