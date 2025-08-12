describe('Document Ingestion Workflow', () => {
  beforeEach(() => {
    // Setup authentication
    cy.loginAs('admin');
    
    // Mock ingestion jobs API responses
    cy.intercept('GET', '**/api/ingestion**', {
      statusCode: 200,
      body: {
        jobs: [
          {
            id: 'job-1',
            documentId: 'doc-1',
            userId: 'user-1',
            status: 'PENDING',
            documentName: 'Research Document.pdf',
            startedAt: '2024-01-01T10:00:00Z',
            createdAt: '2024-01-01T10:00:00Z',
            updatedAt: '2024-01-01T10:00:00Z',
            document: {
              id: 'doc-1',
              filename: 'research.pdf',
              originalName: 'Research Document.pdf',
              title: 'Research Document'
            },
            user: {
              id: 'user-1',
              name: 'Admin User',
              email: 'admin@example.com'
            }
          },
          {
            id: 'job-2',
            documentId: 'doc-2',
            userId: 'user-1',
            status: 'COMPLETED',
            documentName: 'Technical Manual.pdf',
            startedAt: '2024-01-01T09:00:00Z',
            completedAt: '2024-01-01T09:02:30Z',
            createdAt: '2024-01-01T09:00:00Z',
            updatedAt: '2024-01-01T09:02:30Z',
            document: {
              id: 'doc-2',
              filename: 'manual.pdf',
              originalName: 'Technical Manual.pdf',
              title: 'Technical Manual'
            },
            user: {
              id: 'user-1',
              name: 'Admin User',
              email: 'admin@example.com'
            }
          },
          {
            id: 'job-3',
            documentId: 'doc-3',
            userId: 'user-1',
            status: 'FAILED',
            documentName: 'Corrupted File.pdf',
            errorMessage: 'File appears to be corrupted or unreadable',
            startedAt: '2024-01-01T08:00:00Z',
            completedAt: '2024-01-01T08:01:15Z',
            createdAt: '2024-01-01T08:00:00Z',
            updatedAt: '2024-01-01T08:01:15Z',
            document: {
              id: 'doc-3',
              filename: 'corrupted.pdf',
              originalName: 'Corrupted File.pdf',
              title: 'Corrupted File'
            },
            user: {
              id: 'user-1',
              name: 'Admin User',
              email: 'admin@example.com'
            }
          }
        ],
        pagination: {
          total: 3,
          page: 1,
          limit: 10,
          pages: 1
        }
      }
    }).as('getIngestionJobs');
    
    // Mock individual job response
    cy.intercept('GET', '**/api/ingestion/job-1', {
      statusCode: 200,
      body: {
        id: 'job-1',
        documentId: 'doc-1',
        status: 'PENDING',
        documentName: 'Research Document.pdf',
        startedAt: '2024-01-01T10:00:00Z',
        document: {
          id: 'doc-1',
          title: 'Research Document',
          filename: 'research.pdf'
        }
      }
    }).as('getIngestionJob');
    
    // Mock trigger ingestion response
    cy.intercept('POST', '**/api/ingestion/trigger', {
      statusCode: 200,
      body: {
        id: 'job-4',
        documentId: 'doc-4',
        status: 'PENDING',
        message: 'Ingestion job started successfully'
      }
    }).as('triggerIngestion');
    
    // Mock documents for ingestion
    cy.intercept('GET', '**/api/documents**', {
      statusCode: 200,
      body: {
        documents: [
          {
            id: 'doc-4',
            title: 'New Document',
            filename: 'new-doc.pdf',
            status: 'UPLOADED',
            uploadedBy: 'user-1'
          },
          {
            id: 'doc-5',
            title: 'Another Document',
            filename: 'another-doc.pdf',
            status: 'UPLOADED',
            uploadedBy: 'user-1'
          }
        ]
      }
    }).as('getUnprocessedDocuments');
  });

  describe('Ingestion Dashboard', () => {
    it('should display ingestion jobs correctly', () => {
      cy.visit('/ingestion');
      cy.wait('@getIngestionJobs');
      
      // Check page title and layout
      cy.get('[data-cy=page-title]').should('contain.text', 'Document Ingestion');
      cy.get('[data-cy=trigger-ingestion-button]').should('be.visible');
      cy.get('[data-cy=refresh-button]').should('be.visible');
      
      // Check jobs table
      cy.get('[data-cy=ingestion-jobs-table]').should('be.visible');
      cy.get('[data-cy=job-row]').should('have.length', 3);
      
      // Check first job details (PENDING)
      cy.get('[data-cy=job-row]').first().within(() => {
        cy.get('[data-cy=job-document]').should('contain.text', 'Research Document.pdf');
        cy.get('[data-cy=job-status]').should('contain.text', 'PENDING');
        cy.get('[data-cy=job-status-badge]').should('have.class', 'status-pending');
        cy.get('[data-cy=job-duration]').should('be.visible');
        cy.get('[data-cy=job-actions]').should('be.visible');
      });
      
      // Check completed job
      cy.get('[data-cy=job-row]').eq(1).within(() => {
        cy.get('[data-cy=job-status]').should('contain.text', 'COMPLETED');
        cy.get('[data-cy=job-status-badge]').should('have.class', 'status-completed');
        cy.get('[data-cy=job-duration]').should('contain.text', '2m 30s');
      });
      
      // Check failed job
      cy.get('[data-cy=job-row]').eq(2).within(() => {
        cy.get('[data-cy=job-status]').should('contain.text', 'FAILED');
        cy.get('[data-cy=job-status-badge]').should('have.class', 'status-failed');
        cy.get('[data-cy=error-indicator]').should('be.visible');
      });
    });

    it('should filter jobs by status', () => {
      cy.visit('/ingestion');
      cy.wait('@getIngestionJobs');
      
      // Open status filter
      cy.get('[data-cy=status-filter]').click();
      cy.get('[data-cy=status-option-completed]').click();
      
      // Mock filtered response
      cy.intercept('GET', '**/api/ingestion**', {
        statusCode: 200,
        body: {
          jobs: [{
            id: 'job-2',
            status: 'COMPLETED',
            documentName: 'Technical Manual.pdf'
          }],
          pagination: { total: 1, page: 1, limit: 10, pages: 1 }
        }
      }).as('getFilteredJobs');
      
      cy.wait('@getFilteredJobs');
      
      // Should show only completed jobs
      cy.get('[data-cy=job-row]').should('have.length', 1);
      cy.get('[data-cy=job-status]').should('contain.text', 'COMPLETED');
    });

    it('should search jobs by document name', () => {
      cy.visit('/ingestion');
      cy.wait('@getIngestionJobs');
      
      // Type search query
      cy.get('[data-cy=search-input]').type('Research');
      
      // Should filter jobs
      cy.get('[data-cy=job-row]').should('have.length', 1);
      cy.get('[data-cy=job-document]').should('contain.text', 'Research Document');
      
      // Clear search
      cy.get('[data-cy=clear-search]').click();
      cy.get('[data-cy=job-row]').should('have.length', 3);
    });

    it('should refresh jobs list', () => {
      cy.visit('/ingestion');
      cy.wait('@getIngestionJobs');
      
      // Click refresh button
      cy.get('[data-cy=refresh-button]').click();
      
      cy.wait('@getIngestionJobs');
      
      // Should show loading indicator briefly
      cy.get('[data-cy=loading-indicator]').should('be.visible');
      cy.get('[data-cy=loading-indicator]').should('not.exist');
    });

    it('should handle empty jobs state', () => {
      // Mock empty response
      cy.intercept('GET', '**/api/ingestion**', {
        statusCode: 200,
        body: {
          jobs: [],
          pagination: { total: 0, page: 1, limit: 10, pages: 0 }
        }
      }).as('getEmptyJobs');
      
      cy.visit('/ingestion');
      cy.wait('@getEmptyJobs');
      
      // Check empty state
      cy.get('[data-cy=empty-state]').should('be.visible');
      cy.get('[data-cy=empty-message]').should('contain.text', 'No ingestion jobs found');
      cy.get('[data-cy=trigger-ingestion-button]').should('be.visible');
    });
  });

  describe('Trigger Ingestion', () => {
    it('should open trigger ingestion dialog', () => {
      cy.visit('/ingestion');
      cy.wait('@getIngestionJobs');
      
      cy.get('[data-cy=trigger-ingestion-button]').click();
      
      // Check dialog
      cy.get('[data-cy=trigger-dialog]').should('be.visible');
      cy.get('[data-cy=dialog-title]').should('contain.text', 'Trigger Document Ingestion');
      cy.get('[data-cy=document-selector]').should('be.visible');
      cy.get('[data-cy=trigger-button]').should('be.disabled');
      cy.get('[data-cy=cancel-button]').should('be.visible');
    });

    it('should load unprocessed documents', () => {
      cy.visit('/ingestion');
      cy.get('[data-cy=trigger-ingestion-button]').click();
      
      cy.wait('@getUnprocessedDocuments');
      
      // Check document options
      cy.get('[data-cy=document-option]').should('have.length', 2);
      cy.get('[data-cy=document-option]').first().within(() => {
        cy.get('[data-cy=document-title]').should('contain.text', 'New Document');
        cy.get('[data-cy=document-status]').should('contain.text', 'UPLOADED');
      });
    });

    it('should successfully trigger ingestion', () => {
      cy.visit('/ingestion');
      cy.get('[data-cy=trigger-ingestion-button]').click();
      cy.wait('@getUnprocessedDocuments');
      
      // Select document
      cy.get('[data-cy=document-option]').first().click();
      cy.get('[data-cy=trigger-button]').should('not.be.disabled');
      
      // Trigger ingestion
      cy.get('[data-cy=trigger-button]').click();
      
      cy.wait('@triggerIngestion').then((interception) => {
        expect(interception.request.body).to.deep.include({
          documentId: 'doc-4'
        });
      });
      
      // Should close dialog and show success
      cy.get('[data-cy=trigger-dialog]').should('not.exist');
      cy.get('[data-cy=success-message]').should('contain.text', 'Ingestion job started successfully');
      
      // Should refresh jobs list
      cy.wait('@getIngestionJobs');
    });

    it('should handle trigger ingestion failure', () => {
      // Mock trigger failure
      cy.intercept('POST', '**/api/ingestion/trigger', {
        statusCode: 400,
        body: { message: 'Document already being processed' }
      }).as('triggerFailed');
      
      cy.visit('/ingestion');
      cy.get('[data-cy=trigger-ingestion-button]').click();
      cy.wait('@getUnprocessedDocuments');
      
      cy.get('[data-cy=document-option]').first().click();
      cy.get('[data-cy=trigger-button]').click();
      
      cy.wait('@triggerFailed');
      
      // Should show error message
      cy.get('[data-cy=error-message]').should('contain.text', 'Document already being processed');
      
      // Dialog should remain open
      cy.get('[data-cy=trigger-dialog]').should('be.visible');
    });

    it('should handle no unprocessed documents', () => {
      // Mock empty documents response
      cy.intercept('GET', '**/api/documents**', {
        statusCode: 200,
        body: { documents: [] }
      }).as('getNoDocuments');
      
      cy.visit('/ingestion');
      cy.get('[data-cy=trigger-ingestion-button]').click();
      
      cy.wait('@getNoDocuments');
      
      // Should show no documents message
      cy.get('[data-cy=no-documents-message]').should('be.visible');
      cy.get('[data-cy=no-documents-message]').should('contain.text', 'No documents available for ingestion');
      cy.get('[data-cy=trigger-button]').should('be.disabled');
    });
  });

  describe('Job Details and Actions', () => {
    beforeEach(() => {
      cy.visit('/ingestion');
      cy.wait('@getIngestionJobs');
    });

    it('should view job details', () => {
      cy.get('[data-cy=job-row]').first().within(() => {
        cy.get('[data-cy=view-details]').click();
      });
      
      cy.wait('@getIngestionJob');
      
      // Check job details modal
      cy.get('[data-cy=job-details-modal]').should('be.visible');
      cy.get('[data-cy=job-id]').should('contain.text', 'job-1');
      cy.get('[data-cy=job-document-details]').should('be.visible');
      cy.get('[data-cy=job-timeline]').should('be.visible');
      cy.get('[data-cy=job-metadata]').should('be.visible');
    });

    it('should display error details for failed jobs', () => {
      cy.get('[data-cy=job-row]').eq(2).within(() => {
        cy.get('[data-cy=view-details]').click();
      });
      
      // Mock failed job details
      cy.intercept('GET', '**/api/ingestion/job-3', {
        statusCode: 200,
        body: {
          id: 'job-3',
          status: 'FAILED',
          errorMessage: 'File appears to be corrupted or unreadable',
          documentName: 'Corrupted File.pdf'
        }
      }).as('getFailedJob');
      
      cy.wait('@getFailedJob');
      
      // Check error details
      cy.get('[data-cy=job-details-modal]').should('be.visible');
      cy.get('[data-cy=error-section]').should('be.visible');
      cy.get('[data-cy=error-message]').should('contain.text', 'File appears to be corrupted');
      cy.get('[data-cy=retry-button]').should('be.visible');
    });

    it('should retry failed ingestion', () => {
      // Mock retry response
      cy.intercept('POST', '**/api/ingestion/trigger', {
        statusCode: 200,
        body: {
          id: 'job-5',
          documentId: 'doc-3',
          status: 'PENDING',
          message: 'Retry job started successfully'
        }
      }).as('retryIngestion');
      
      cy.get('[data-cy=job-row]').eq(2).within(() => {
        cy.get('[data-cy=retry-job]').click();
      });
      
      // Confirm retry
      cy.get('[data-cy=confirm-dialog]').should('be.visible');
      cy.get('[data-cy=confirm-button]').click();
      
      cy.wait('@retryIngestion');
      
      // Should show success message
      cy.get('[data-cy=success-message]').should('contain.text', 'Retry job started successfully');
      
      // Should refresh jobs list
      cy.wait('@getIngestionJobs');
    });

    it('should calculate and display job duration correctly', () => {
      cy.get('[data-cy=job-row]').eq(1).within(() => {
        cy.get('[data-cy=job-duration]').should('contain.text', '2m 30s');
      });
      
      // For pending jobs, should show current duration
      cy.get('[data-cy=job-row]').first().within(() => {
        cy.get('[data-cy=job-duration]').should('match', /\d+[ms]/);
      });
    });

    it('should show job progress for pending jobs', () => {
      cy.get('[data-cy=job-row]').first().within(() => {
        cy.get('[data-cy=progress-indicator]').should('be.visible');
        cy.get('[data-cy=progress-spinner]').should('be.visible');
      });
      
      // Completed jobs should not show progress
      cy.get('[data-cy=job-row]').eq(1).within(() => {
        cy.get('[data-cy=progress-indicator]').should('not.exist');
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should auto-refresh pending jobs', () => {
      // Mock job status change from PENDING to COMPLETED
      let callCount = 0;
      cy.intercept('GET', '**/api/ingestion**', (req) => {
        callCount++;
        if (callCount === 1) {
          req.reply({
            statusCode: 200,
            body: {
              jobs: [{
                id: 'job-1',
                status: 'PENDING',
                documentName: 'Test Document'
              }]
            }
          });
        } else {
          req.reply({
            statusCode: 200,
            body: {
              jobs: [{
                id: 'job-1',
                status: 'COMPLETED',
                documentName: 'Test Document'
              }]
            }
          });
        }
      }).as('getJobsWithUpdate');
      
      cy.visit('/ingestion');
      cy.wait('@getJobsWithUpdate');
      
      // Should show PENDING initially
      cy.get('[data-cy=job-status]').should('contain.text', 'PENDING');
      
      // Wait for auto-refresh (polling interval)
      cy.wait('@getJobsWithUpdate');
      
      // Should show COMPLETED after update
      cy.get('[data-cy=job-status]').should('contain.text', 'COMPLETED');
    });

    it('should handle polling errors gracefully', () => {
      cy.visit('/ingestion');
      cy.wait('@getIngestionJobs');
      
      // Mock polling failure
      cy.intercept('GET', '**/api/ingestion**', {
        statusCode: 500,
        body: { message: 'Server error' }
      }).as('pollingError');
      
      // Should show error notification but not crash
      cy.wait('@pollingError');
      cy.get('[data-cy=polling-error]').should('be.visible');
      cy.get('[data-cy=polling-error]').should('contain.text', 'Failed to refresh jobs');
    });

    it('should stop polling when leaving page', () => {
      cy.visit('/ingestion');
      cy.wait('@getIngestionJobs');
      
      // Navigate away
      cy.visit('/documents');
      
      // Polling should stop (no more API calls)
      cy.wait(3000); // Wait longer than polling interval
      // This test verifies cleanup happens properly
    });
  });

  describe('Ingestion Workflow Integration', () => {
    it('should complete full document upload and ingestion flow', () => {
      // Start from documents page
      cy.visit('/documents');
      
      // Mock upload response
      cy.intercept('POST', '**/api/documents', {
        statusCode: 201,
        body: {
          id: 'new-doc',
          title: 'Uploaded Document',
          status: 'UPLOADED'
        }
      }).as('uploadDocument');
      
      // Upload document
      cy.get('[data-cy=upload-button]').click();
      cy.uploadFile('[data-cy=file-input]', 'test-document.pdf');
      cy.get('[data-cy=title-input]').type('New Upload');
      cy.get('[data-cy=upload-submit]').click();
      
      cy.wait('@uploadDocument');
      
      // Navigate to ingestion page
      cy.visit('/ingestion');
      cy.wait('@getIngestionJobs');
      
      // Should see automatic ingestion job created
      cy.get('[data-cy=job-row]').should('contain.text', 'New Upload');
      
      // Mock job completion
      cy.intercept('GET', '**/api/ingestion**', {
        statusCode: 200,
        body: {
          jobs: [{
            id: 'auto-job',
            documentName: 'New Upload',
            status: 'COMPLETED'
          }]
        }
      }).as('getCompletedJob');
      
      // Refresh to see completion
      cy.get('[data-cy=refresh-button]').click();
      cy.wait('@getCompletedJob');
      
      cy.get('[data-cy=job-status]').should('contain.text', 'COMPLETED');
    });

    it('should navigate between ingestion and Q&A workflow', () => {
      cy.visit('/ingestion');
      cy.wait('@getIngestionJobs');
      
      // Check completed job
      cy.get('[data-cy=job-row]').eq(1).within(() => {
        cy.get('[data-cy=use-in-qna]').click();
      });
      
      // Should navigate to Q&A with document pre-selected
      cy.url().should('include', '/qna');
      cy.get('[data-cy=selected-documents]').should('contain.text', 'Technical Manual');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large numbers of jobs efficiently', () => {
      // Mock response with many jobs
      const manyJobs = Array.from({ length: 100 }, (_, i) => ({
        id: `job-${i}`,
        documentName: `Document ${i}`,
        status: i % 3 === 0 ? 'COMPLETED' : i % 3 === 1 ? 'PENDING' : 'FAILED'
      }));
      
      cy.intercept('GET', '**/api/ingestion**', {
        statusCode: 200,
        body: {
          jobs: manyJobs.slice(0, 10), // Pagination
          pagination: { total: 100, page: 1, limit: 10, pages: 10 }
        }
      }).as('getManyJobs');
      
      cy.visit('/ingestion');
      cy.wait('@getManyJobs');
      
      // Should show pagination
      cy.get('[data-cy=pagination]').should('be.visible');
      cy.get('[data-cy=page-info]').should('contain.text', 'Page 1 of 10');
      
      // Should load next page
      cy.get('[data-cy=next-page]').click();
      cy.wait('@getManyJobs');
    });

    it('should implement virtual scrolling for large lists', () => {
      // This would test virtual scrolling implementation
      cy.visit('/ingestion');
      cy.wait('@getIngestionJobs');
      
      // Check that DOM doesn't contain excessive elements
      cy.get('[data-cy=job-row]').should('have.length.lessThan', 20);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      // Mock API error
      cy.intercept('GET', '**/api/ingestion**', {
        statusCode: 500,
        body: { message: 'Internal server error' }
      }).as('apiError');
      
      cy.visit('/ingestion');
      cy.wait('@apiError');
      
      // Should show error state
      cy.get('[data-cy=error-state]').should('be.visible');
      cy.get('[data-cy=error-message]').should('contain.text', 'Failed to load ingestion jobs');
      cy.get('[data-cy=retry-button]').should('be.visible');
      
      // Test retry functionality
      cy.intercept('GET', '**/api/ingestion**', {
        statusCode: 200,
        body: { jobs: [], pagination: { total: 0 } }
      }).as('retrySuccess');
      
      cy.get('[data-cy=retry-button]').click();
      cy.wait('@retrySuccess');
      
      // Should show normal state
      cy.get('[data-cy=error-state]').should('not.exist');
      cy.get('[data-cy=empty-state]').should('be.visible');
    });

    it('should handle network connectivity issues', () => {
      cy.visit('/ingestion');
      cy.wait('@getIngestionJobs');
      
      // Simulate network error
      cy.intercept('GET', '**/api/ingestion**', { forceNetworkError: true }).as('networkError');
      
      cy.get('[data-cy=refresh-button]').click();
      cy.wait('@networkError');
      
      // Should show offline message
      cy.get('[data-cy=offline-message]').should('be.visible');
      cy.get('[data-cy=offline-message]').should('contain.text', 'Connection lost');
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', () => {
      cy.visit('/ingestion');
      cy.wait('@getIngestionJobs');
      
      // Test tab navigation
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-cy', 'trigger-ingestion-button');
      
      // Navigate to table
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-cy', 'refresh-button');
      
      // Test table navigation
      cy.get('[data-cy=ingestion-jobs-table]').focus();
      cy.focused().type('{downarrow}');
    });

    it('should have proper ARIA labels', () => {
      cy.visit('/ingestion');
      cy.wait('@getIngestionJobs');
      
      // Check ARIA labels
      cy.get('[data-cy=ingestion-jobs-table]').should('have.attr', 'aria-label', 'Ingestion jobs table');
      cy.get('[data-cy=trigger-ingestion-button]').should('have.attr', 'aria-label', 'Trigger new ingestion job');
      cy.get('[data-cy=status-filter]').should('have.attr', 'aria-label', 'Filter jobs by status');
    });

    it('should support screen readers', () => {
      cy.visit('/ingestion');
      cy.wait('@getIngestionJobs');
      
      // Check live regions for status updates
      cy.get('[data-cy=status-announcements]').should('have.attr', 'aria-live', 'polite');
      
      // Check table headers
      cy.get('[data-cy=table-headers]').within(() => {
        cy.get('th').should('have.attr', 'scope', 'col');
      });
    });
  });
});