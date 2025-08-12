describe('Document Management', () => {
  beforeEach(() => {
    // Setup authentication
    cy.loginAs('admin');
    
    // Mock documents API responses
    cy.fixture('documents').then((documentsData) => {
      cy.intercept('GET', '**/api/documents**', {
        statusCode: 200,
        body: documentsData
      }).as('getDocuments');
    });
    
    // Mock individual document response
    cy.intercept('GET', '**/api/documents/1', {
      statusCode: 200,
      body: {
        id: '1',
        filename: 'test-document-1.pdf',
        originalName: 'Test Document 1.pdf',
        mimetype: 'application/pdf',
        size: 1024000,
        title: 'Test Document 1',
        description: 'First test document',
        status: 'PROCESSED'
      }
    }).as('getDocument');
    
    // Mock upload response
    cy.intercept('POST', '**/api/documents', {
      statusCode: 201,
      body: {
        id: '3',
        filename: 'uploaded-document.pdf',
        originalName: 'Uploaded Document.pdf',
        mimetype: 'application/pdf',
        size: 1536000,
        title: 'Uploaded Document',
        status: 'UPLOADED'
      }
    }).as('uploadDocument');
    
    // Mock update response
    cy.intercept('PATCH', '**/api/documents/1', {
      statusCode: 200,
      body: {
        id: '1',
        filename: 'test-document-1.pdf',
        originalName: 'Test Document 1.pdf',
        title: 'Updated Test Document',
        description: 'Updated description'
      }
    }).as('updateDocument');
    
    // Mock delete response
    cy.intercept('DELETE', '**/api/documents/1', {
      statusCode: 200,
      body: { message: 'Document deleted successfully' }
    }).as('deleteDocument');
    
    // Mock download response
    cy.intercept('GET', '**/api/documents/1/download', {
      statusCode: 200,
      body: 'PDF content here'
    }).as('downloadDocument');
  });

  describe('Document List View', () => {
    it('should display documents list correctly', () => {
      cy.visit('/documents');
      cy.wait('@getDocuments');
      
      // Check page title
      cy.get('[data-cy=page-title]').should('contain.text', 'Documents');
      
      // Check upload button
      cy.get('[data-cy=upload-button]').should('be.visible');
      
      // Check documents table
      cy.get('[data-cy=documents-table]').should('be.visible');
      cy.get('[data-cy=document-row]').should('have.length', 2);
      
      // Check first document details
      cy.get('[data-cy=document-row]').first().within(() => {
        cy.get('[data-cy=document-title]').should('contain.text', 'Test Document 1');
        cy.get('[data-cy=document-status]').should('contain.text', 'PROCESSED');
        cy.get('[data-cy=document-size]').should('contain.text', '1 MB');
        cy.get('[data-cy=actions-menu]').should('be.visible');
      });
    });

    it('should filter documents by status', () => {
      cy.visit('/documents');
      cy.wait('@getDocuments');
      
      // Open status filter
      cy.get('[data-cy=status-filter]').click();
      cy.get('[data-cy=status-option-processing]').click();
      
      // Mock filtered response
      cy.intercept('GET', '**/api/documents**', {
        statusCode: 200,
        body: {
          documents: [{
            id: '2',
            title: 'Test Document 2',
            status: 'PROCESSING'
          }],
          pagination: { total: 1, page: 1, limit: 10, pages: 1 }
        }
      }).as('getFilteredDocuments');
      
      cy.wait('@getFilteredDocuments');
      
      // Should show only processing documents
      cy.get('[data-cy=document-row]').should('have.length', 1);
      cy.get('[data-cy=document-status]').should('contain.text', 'PROCESSING');
    });

    it('should search documents by title', () => {
      cy.visit('/documents');
      cy.wait('@getDocuments');
      
      // Type in search box
      cy.get('[data-cy=search-input]').type('Test Document 1');
      
      // Mock search response
      cy.intercept('GET', '**/api/documents**', {
        statusCode: 200,
        body: {
          documents: [{
            id: '1',
            title: 'Test Document 1',
            status: 'PROCESSED'
          }],
          pagination: { total: 1, page: 1, limit: 10, pages: 1 }
        }
      }).as('searchDocuments');
      
      cy.wait('@searchDocuments');
      
      // Should show only matching document
      cy.get('[data-cy=document-row]').should('have.length', 1);
      cy.get('[data-cy=document-title]').should('contain.text', 'Test Document 1');
    });

    it('should handle pagination correctly', () => {
      // Mock paginated response
      cy.intercept('GET', '**/api/documents**', {
        statusCode: 200,
        body: {
          documents: [],
          pagination: { total: 50, page: 1, limit: 10, pages: 5 }
        }
      }).as('getPaginatedDocuments');
      
      cy.visit('/documents');
      cy.wait('@getPaginatedDocuments');
      
      // Check pagination controls
      cy.get('[data-cy=pagination]').should('be.visible');
      cy.get('[data-cy=page-info]').should('contain.text', 'Page 1 of 5');
      
      // Test next page
      cy.get('[data-cy=next-page]').click();
      
      // Should request page 2
      cy.wait('@getPaginatedDocuments');
    });

    it('should handle empty state', () => {
      // Mock empty response
      cy.intercept('GET', '**/api/documents**', {
        statusCode: 200,
        body: {
          documents: [],
          pagination: { total: 0, page: 1, limit: 10, pages: 0 }
        }
      }).as('getEmptyDocuments');
      
      cy.visit('/documents');
      cy.wait('@getEmptyDocuments');
      
      // Check empty state
      cy.get('[data-cy=empty-state]').should('be.visible');
      cy.get('[data-cy=empty-message]').should('contain.text', 'No documents found');
      cy.get('[data-cy=upload-button]').should('be.visible');
    });
  });

  describe('Document Upload', () => {
    it('should open upload dialog', () => {
      cy.visit('/documents');
      cy.wait('@getDocuments');
      
      cy.get('[data-cy=upload-button]').click();
      
      // Check upload dialog
      cy.get('[data-cy=upload-dialog]').should('be.visible');
      cy.get('[data-cy=file-input]').should('be.visible');
      cy.get('[data-cy=title-input]').should('be.visible');
      cy.get('[data-cy=description-input]').should('be.visible');
      cy.get('[data-cy=upload-submit]').should('be.disabled');
    });

    it('should validate file type', () => {
      cy.visit('/documents');
      cy.get('[data-cy=upload-button]').click();
      
      // Try to upload invalid file type
      cy.get('[data-cy=file-input]').selectFile({
        contents: Cypress.Buffer.from('fake image content'),
        fileName: 'test.jpg',
        mimeType: 'image/jpeg'
      });
      
      // Should show error
      cy.get('[data-cy=file-error]').should('contain.text', 'Only PDF, DOC, DOCX, and TXT files are allowed');
      cy.get('[data-cy=upload-submit]').should('be.disabled');
    });

    it('should successfully upload document', () => {
      cy.visit('/documents');
      cy.get('[data-cy=upload-button]').click();
      
      // Upload valid file
      cy.uploadFile('[data-cy=file-input]', 'test-document.pdf');
      
      // Fill form
      cy.get('[data-cy=title-input]').type('New Test Document');
      cy.get('[data-cy=description-input]').type('Test document description');
      
      // Submit upload
      cy.get('[data-cy=upload-submit]').should('not.be.disabled');
      cy.get('[data-cy=upload-submit]').click();
      
      cy.wait('@uploadDocument');
      
      // Should close dialog and show success message
      cy.get('[data-cy=upload-dialog]').should('not.exist');
      cy.get('[data-cy=success-message]').should('contain.text', 'Document uploaded successfully');
      
      // Should refresh documents list
      cy.wait('@getDocuments');
    });

    it('should handle upload failure', () => {
      // Mock upload failure
      cy.intercept('POST', '**/api/documents', {
        statusCode: 413,
        body: { message: 'File too large' }
      }).as('uploadFailed');
      
      cy.visit('/documents');
      cy.get('[data-cy=upload-button]').click();
      
      cy.uploadFile('[data-cy=file-input]', 'test-document.pdf');
      cy.get('[data-cy=title-input]').type('Test Document');
      cy.get('[data-cy=upload-submit]').click();
      
      cy.wait('@uploadFailed');
      
      // Should show error message
      cy.get('[data-cy=error-message]').should('contain.text', 'File too large');
      
      // Dialog should remain open
      cy.get('[data-cy=upload-dialog]').should('be.visible');
    });
  });

  describe('Document Actions', () => {
    beforeEach(() => {
      cy.visit('/documents');
      cy.wait('@getDocuments');
    });

    it('should view document details', () => {
      cy.get('[data-cy=document-row]').first().within(() => {
        cy.get('[data-cy=actions-menu]').click();
      });
      
      cy.get('[data-cy=view-action]').click();
      
      // Should navigate to document details
      cy.url().should('include', '/documents/1');
      cy.wait('@getDocument');
      
      // Check document details page
      cy.get('[data-cy=document-title]').should('contain.text', 'Test Document 1');
      cy.get('[data-cy=document-description]').should('be.visible');
      cy.get('[data-cy=document-metadata]').should('be.visible');
    });

    it('should edit document metadata', () => {
      cy.get('[data-cy=document-row]').first().within(() => {
        cy.get('[data-cy=actions-menu]').click();
      });
      
      cy.get('[data-cy=edit-action]').click();
      
      // Check edit dialog
      cy.get('[data-cy=edit-dialog]').should('be.visible');
      cy.get('[data-cy=edit-title]').should('have.value', 'Test Document 1');
      cy.get('[data-cy=edit-description]').should('have.value', 'First test document');
      
      // Update fields
      cy.get('[data-cy=edit-title]').clear().type('Updated Test Document');
      cy.get('[data-cy=edit-description]').clear().type('Updated description');
      
      // Submit changes
      cy.get('[data-cy=save-changes]').click();
      
      cy.wait('@updateDocument');
      
      // Should close dialog and show success
      cy.get('[data-cy=edit-dialog]').should('not.exist');
      cy.get('[data-cy=success-message]').should('contain.text', 'Document updated successfully');
    });

    it('should download document', () => {
      cy.get('[data-cy=document-row]').first().within(() => {
        cy.get('[data-cy=actions-menu]').click();
      });
      
      cy.get('[data-cy=download-action]').click();
      
      cy.wait('@downloadDocument');
      
      // Check download was triggered (file download can't be easily tested in Cypress)
      // We verify the API call was made
    });

    it('should trigger document ingestion', () => {
      // Mock ingestion trigger
      cy.intercept('POST', '**/api/documents/1/ingest', {
        statusCode: 200,
        body: { message: 'Ingestion started' }
      }).as('triggerIngestion');
      
      cy.get('[data-cy=document-row]').first().within(() => {
        cy.get('[data-cy=actions-menu]').click();
      });
      
      cy.get('[data-cy=ingest-action]').click();
      
      cy.wait('@triggerIngestion');
      
      // Should show success message
      cy.get('[data-cy=success-message]').should('contain.text', 'Ingestion started');
    });

    it('should delete document with confirmation', () => {
      cy.get('[data-cy=document-row]').first().within(() => {
        cy.get('[data-cy=actions-menu]').click();
      });
      
      cy.get('[data-cy=delete-action]').click();
      
      // Check confirmation dialog
      cy.get('[data-cy=confirm-dialog]').should('be.visible');
      cy.get('[data-cy=confirm-message]').should('contain.text', 'Are you sure you want to delete this document?');
      
      // Cancel first
      cy.get('[data-cy=cancel-button]').click();
      cy.get('[data-cy=confirm-dialog]').should('not.exist');
      
      // Try again and confirm
      cy.get('[data-cy=document-row]').first().within(() => {
        cy.get('[data-cy=actions-menu]').click();
      });
      cy.get('[data-cy=delete-action]').click();
      cy.get('[data-cy=confirm-button]').click();
      
      cy.wait('@deleteDocument');
      
      // Should show success and refresh list
      cy.get('[data-cy=success-message]').should('contain.text', 'Document deleted successfully');
      cy.wait('@getDocuments');
    });
  });

  describe('Document Details Page', () => {
    it('should display document details correctly', () => {
      cy.visit('/documents/1');
      cy.wait('@getDocument');
      
      // Check document information
      cy.get('[data-cy=document-title]').should('contain.text', 'Test Document 1');
      cy.get('[data-cy=document-filename]').should('contain.text', 'test-document-1.pdf');
      cy.get('[data-cy=document-size]').should('contain.text', '1 MB');
      cy.get('[data-cy=document-status]').should('contain.text', 'PROCESSED');
      cy.get('[data-cy=document-type]').should('contain.text', 'PDF');
      
      // Check action buttons
      cy.get('[data-cy=edit-button]').should('be.visible');
      cy.get('[data-cy=download-button]').should('be.visible');
      cy.get('[data-cy=delete-button]').should('be.visible');
      cy.get('[data-cy=back-button]').should('be.visible');
    });

    it('should navigate back to documents list', () => {
      cy.visit('/documents/1');
      cy.wait('@getDocument');
      
      cy.get('[data-cy=back-button]').click();
      
      cy.url().should('eq', Cypress.config().baseUrl + '/documents');
    });

    it('should handle document not found', () => {
      // Mock 404 response
      cy.intercept('GET', '**/api/documents/999', {
        statusCode: 404,
        body: { message: 'Document not found' }
      }).as('documentNotFound');
      
      cy.visit('/documents/999');
      cy.wait('@documentNotFound');
      
      // Should show error message
      cy.get('[data-cy=error-message]').should('contain.text', 'Document not found');
      cy.get('[data-cy=back-button]').should('be.visible');
    });
  });

  describe('Document Status Indicators', () => {
    it('should display correct status badges', () => {
      // Mock documents with different statuses
      cy.intercept('GET', '**/api/documents**', {
        statusCode: 200,
        body: {
          documents: [
            { id: '1', title: 'Uploaded Doc', status: 'UPLOADED' },
            { id: '2', title: 'Processing Doc', status: 'PROCESSING' },
            { id: '3', title: 'Processed Doc', status: 'PROCESSED' },
            { id: '4', title: 'Failed Doc', status: 'FAILED' }
          ],
          pagination: { total: 4, page: 1, limit: 10, pages: 1 }
        }
      }).as('getDocumentsWithStatuses');
      
      cy.visit('/documents');
      cy.wait('@getDocumentsWithStatuses');
      
      // Check status badges
      cy.get('[data-cy=document-row]').eq(0).within(() => {
        cy.get('[data-cy=status-badge]').should('have.class', 'status-uploaded');
      });
      
      cy.get('[data-cy=document-row]').eq(1).within(() => {
        cy.get('[data-cy=status-badge]').should('have.class', 'status-processing');
      });
      
      cy.get('[data-cy=document-row]').eq(2).within(() => {
        cy.get('[data-cy=status-badge]').should('have.class', 'status-processed');
      });
      
      cy.get('[data-cy=document-row]').eq(3).within(() => {
        cy.get('[data-cy=status-badge]').should('have.class', 'status-failed');
      });
    });
  });

  describe('Responsive Design', () => {
    it('should work correctly on mobile devices', () => {
      cy.viewport(375, 667);
      cy.visit('/documents');
      cy.wait('@getDocuments');
      
      // Check mobile layout
      cy.get('[data-cy=documents-table]').should('be.visible');
      cy.get('[data-cy=upload-button]').should('be.visible');
      
      // Check mobile actions menu
      cy.get('[data-cy=document-row]').first().within(() => {
        cy.get('[data-cy=actions-menu]').click();
      });
      
      cy.get('[data-cy=mobile-actions]').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', () => {
      cy.visit('/documents');
      cy.wait('@getDocuments');
      
      // Test tab navigation
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-cy', 'upload-button');
      
      // Test table navigation
      cy.get('[data-cy=documents-table]').focus();
      cy.focused().type('{downarrow}');
      
      // Test actions menu with keyboard
      cy.focused().type('{enter}');
      cy.get('[data-cy=actions-menu]').should('be.visible');
    });

    it('should have proper ARIA labels', () => {
      cy.visit('/documents');
      cy.wait('@getDocuments');
      
      // Check ARIA labels
      cy.get('[data-cy=documents-table]').should('have.attr', 'aria-label', 'Documents table');
      cy.get('[data-cy=upload-button]').should('have.attr', 'aria-label', 'Upload new document');
      cy.get('[data-cy=search-input]').should('have.attr', 'aria-label', 'Search documents');
    });
  });
});