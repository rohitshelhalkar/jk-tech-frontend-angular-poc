describe('Application Health Check', () => {
  it('should load the application successfully', () => {
    // Visit the base URL
    cy.visit('/');
    
    // Should redirect to login page for unauthenticated users
    cy.url().should('include', '/auth/login');
    
    // Check that the page loads without errors
    cy.get('body').should('be.visible');
    
    // Check for basic page elements
    cy.get('[data-cy=login-form], [data-cy=email-input]').should('exist');
  });

  it('should handle 404 pages gracefully', () => {
    cy.visit('/nonexistent-page', { failOnStatusCode: false });
    
    // Should show 404 page or redirect to login
    cy.url().should('satisfy', (url: string) => {
      return url.includes('/auth/login') || url.includes('/404');
    });
  });

  it('should have proper meta tags and title', () => {
    cy.visit('/auth/login');
    
    // Check page title
    cy.title().should('include', 'JK Tech');
    
    // Check viewport meta tag for responsive design
    cy.get('meta[name="viewport"]').should('have.attr', 'content', 'width=device-width, initial-scale=1');
  });
});