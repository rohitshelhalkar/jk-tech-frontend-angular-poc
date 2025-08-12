describe('Q&A RAG System', () => {
  beforeEach(() => {
    // Setup authentication
    cy.loginAs('admin');
    
    // Mock conversations API responses
    cy.intercept('GET', '**/api/qna/conversations**', {
      statusCode: 200,
      body: {
        conversations: [
          {
            id: '1',
            title: 'Document Analysis',
            userId: '1',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            messages: []
          },
          {
            id: '2',
            title: 'Technical Questions',
            userId: '1',
            createdAt: '2024-01-01T01:00:00Z',
            updatedAt: '2024-01-01T01:00:00Z',
            messages: []
          }
        ],
        total: 2,
        limit: 20,
        offset: 0
      }
    }).as('getConversations');
    
    // Mock individual conversation response
    cy.intercept('GET', '**/api/qna/conversations/1', {
      statusCode: 200,
      body: {
        id: '1',
        title: 'Document Analysis',
        userId: '1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        messages: [
          {
            id: '1',
            conversationId: '1',
            userId: '1',
            content: 'What are the key findings in the research document?',
            role: 'user',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          {
            id: '2',
            conversationId: '1',
            userId: '1',
            content: 'Based on the research document, the key findings include: 1) Improved efficiency by 25%, 2) Cost reduction of 15%, 3) Enhanced user satisfaction scores.',
            role: 'assistant',
            metadata: {
              sources: [
                {
                  documentId: 'doc1',
                  chunkId: 'chunk1',
                  content: 'The study shows a 25% improvement in efficiency...'
                }
              ],
              tokensUsed: 120,
              model: 'gpt-4',
              processingTime: 800
            },
            createdAt: '2024-01-01T00:00:30Z',
            updatedAt: '2024-01-01T00:00:30Z'
          }
        ]
      }
    }).as('getConversation');
    
    // Mock create conversation response
    cy.intercept('POST', '**/api/qna/conversations', {
      statusCode: 201,
      body: {
        id: '3',
        title: 'New Conversation',
        userId: '1',
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        messages: []
      }
    }).as('createConversation');
    
    // Mock send message response
    cy.intercept('POST', '**/api/qna/messages', {
      statusCode: 200,
      body: {
        userMessage: {
          id: '3',
          conversationId: '1',
          userId: '1',
          content: 'How can I improve the process described in the document?',
          role: 'user',
          createdAt: '2024-01-02T00:01:00Z',
          updatedAt: '2024-01-02T00:01:00Z'
        },
        assistantMessage: {
          id: '4',
          conversationId: '1',
          userId: '1',
          content: 'Based on the document analysis, here are three ways to improve the process: 1) Implement automation for repetitive tasks, 2) Streamline approval workflows, 3) Enhance training programs for staff.',
          role: 'assistant',
          metadata: {
            sources: [
              {
                documentId: 'doc1',
                chunkId: 'chunk2',
                content: 'Process improvement recommendations include automation...'
              }
            ],
            tokensUsed: 150,
            model: 'gpt-4',
            processingTime: 1200
          },
          createdAt: '2024-01-02T00:01:30Z',
          updatedAt: '2024-01-02T00:01:30Z'
        }
      }
    }).as('sendMessage');
    
    // Mock update conversation title
    cy.intercept('PUT', '**/api/qna/conversations/1/title', {
      statusCode: 200,
      body: {
        id: '1',
        title: 'Updated Conversation Title',
        userId: '1',
        updatedAt: '2024-01-02T00:02:00Z'
      }
    }).as('updateConversationTitle');
    
    // Mock delete conversation
    cy.intercept('DELETE', '**/api/qna/conversations/1', {
      statusCode: 200,
      body: { message: 'Conversation deleted successfully' }
    }).as('deleteConversation');
    
    // Mock documents for selection
    cy.intercept('GET', '**/api/documents**', {
      statusCode: 200,
      body: {
        documents: [
          {
            id: 'doc1',
            title: 'Research Document',
            filename: 'research.pdf',
            status: 'PROCESSED'
          },
          {
            id: 'doc2',
            title: 'Technical Manual',
            filename: 'manual.pdf',
            status: 'PROCESSED'
          }
        ]
      }
    }).as('getDocuments');
  });

  describe('Q&A Interface Layout', () => {
    it('should display Q&A interface correctly', () => {
      cy.visit('/qna');
      cy.wait('@getConversations');
      
      // Check main layout components
      cy.get('[data-cy=qna-sidebar]').should('be.visible');
      cy.get('[data-cy=qna-main]').should('be.visible');
      
      // Check sidebar elements
      cy.get('[data-cy=new-conversation-button]').should('be.visible');
      cy.get('[data-cy=conversations-list]').should('be.visible');
      cy.get('[data-cy=conversation-item]').should('have.length', 2);
      
      // Check main area
      cy.get('[data-cy=chat-messages]').should('be.visible');
      cy.get('[data-cy=message-input-area]').should('be.visible');
      cy.get('[data-cy=document-selector]').should('be.visible');
    });

    it('should show welcome message when no conversation selected', () => {
      cy.visit('/qna');
      cy.wait('@getConversations');
      
      // Check welcome state
      cy.get('[data-cy=welcome-message]').should('be.visible');
      cy.get('[data-cy=welcome-title]').should('contain.text', 'Welcome to Q&A Assistant');
      cy.get('[data-cy=welcome-description]').should('contain.text', 'Start a new conversation or select an existing one');
    });

    it('should handle responsive layout on mobile', () => {
      cy.viewport(375, 667);
      cy.visit('/qna');
      cy.wait('@getConversations');
      
      // On mobile, sidebar should be collapsible
      cy.get('[data-cy=mobile-menu-toggle]').should('be.visible');
      cy.get('[data-cy=qna-sidebar]').should('have.class', 'collapsed');
      
      // Toggle sidebar
      cy.get('[data-cy=mobile-menu-toggle]').click();
      cy.get('[data-cy=qna-sidebar]').should('not.have.class', 'collapsed');
    });
  });

  describe('Conversation Management', () => {
    it('should create new conversation', () => {
      cy.visit('/qna');
      cy.wait('@getConversations');
      
      cy.get('[data-cy=new-conversation-button]').click();
      
      cy.wait('@createConversation');
      
      // Should navigate to new conversation
      cy.url().should('include', '/qna/3');
      
      // Should update conversations list
      cy.wait('@getConversations');
      cy.get('[data-cy=conversation-item]').should('have.length', 3);
    });

    it('should load existing conversation', () => {
      cy.visit('/qna');
      cy.wait('@getConversations');
      
      // Click on first conversation
      cy.get('[data-cy=conversation-item]').first().click();
      
      cy.wait('@getConversation');
      
      // Should load conversation messages
      cy.url().should('include', '/qna/1');
      cy.get('[data-cy=message-item]').should('have.length', 2);
      
      // Check message content
      cy.get('[data-cy=user-message]').should('contain.text', 'What are the key findings');
      cy.get('[data-cy=assistant-message]').should('contain.text', 'Based on the research document');
    });

    it('should edit conversation title', () => {
      cy.visit('/qna/1');
      cy.wait('@getConversation');
      
      // Click on conversation title to edit
      cy.get('[data-cy=conversation-title]').dblclick();
      cy.get('[data-cy=title-input]').should('be.visible');
      
      // Update title
      cy.get('[data-cy=title-input]').clear().type('Updated Conversation Title');
      cy.get('[data-cy=save-title]').click();
      
      cy.wait('@updateConversationTitle');
      
      // Should show updated title
      cy.get('[data-cy=conversation-title]').should('contain.text', 'Updated Conversation Title');
      cy.get('[data-cy=success-message]').should('contain.text', 'Conversation title updated');
    });

    it('should delete conversation with confirmation', () => {
      cy.visit('/qna/1');
      cy.wait('@getConversation');
      
      // Open conversation menu
      cy.get('[data-cy=conversation-menu]').click();
      cy.get('[data-cy=delete-conversation]').click();
      
      // Check confirmation dialog
      cy.get('[data-cy=confirm-dialog]').should('be.visible');
      cy.get('[data-cy=confirm-message]').should('contain.text', 'Are you sure you want to delete this conversation?');
      
      // Confirm deletion
      cy.get('[data-cy=confirm-button]').click();
      
      cy.wait('@deleteConversation');
      
      // Should redirect to Q&A home
      cy.url().should('eq', Cypress.config().baseUrl + '/qna');
      cy.get('[data-cy=success-message]').should('contain.text', 'Conversation deleted successfully');
      
      // Should refresh conversations list
      cy.wait('@getConversations');
    });

    it('should handle conversation loading errors', () => {
      // Mock 404 response
      cy.intercept('GET', '**/api/qna/conversations/999', {
        statusCode: 404,
        body: { message: 'Conversation not found' }
      }).as('conversationNotFound');
      
      cy.visit('/qna/999');
      cy.wait('@conversationNotFound');
      
      // Should show error message
      cy.get('[data-cy=error-message]').should('contain.text', 'Conversation not found');
      cy.get('[data-cy=back-to-qna]').should('be.visible');
    });
  });

  describe('Message Exchange', () => {
    beforeEach(() => {
      cy.visit('/qna/1');
      cy.wait('@getConversation');
      cy.wait('@getDocuments');
    });

    it('should display existing messages correctly', () => {
      // Check user message
      cy.get('[data-cy=user-message]').should('be.visible');
      cy.get('[data-cy=user-message]').should('contain.text', 'What are the key findings');
      cy.get('[data-cy=user-avatar]').should('be.visible');
      cy.get('[data-cy=message-timestamp]').should('be.visible');
      
      // Check assistant message
      cy.get('[data-cy=assistant-message]').should('be.visible');
      cy.get('[data-cy=assistant-message]').should('contain.text', 'Based on the research document');
      cy.get('[data-cy=assistant-avatar]').should('be.visible');
      
      // Check source citations
      cy.get('[data-cy=message-sources]').should('be.visible');
      cy.get('[data-cy=source-item]').should('have.length', 1);
    });

    it('should send new message successfully', () => {
      // Type message
      cy.get('[data-cy=message-input]').type('How can I improve the process described in the document?');
      
      // Select documents (optional)
      cy.get('[data-cy=document-selector]').click();
      cy.get('[data-cy=document-option]').first().click();
      cy.get('[data-cy=selected-documents]').should('contain.text', 'Research Document');
      
      // Send message
      cy.get('[data-cy=send-button]').should('not.be.disabled');
      cy.get('[data-cy=send-button]').click();
      
      cy.wait('@sendMessage');
      
      // Should clear input
      cy.get('[data-cy=message-input]').should('have.value', '');
      
      // Should show new messages
      cy.get('[data-cy=message-item]').should('have.length', 4);
      
      // Should show typing indicator during processing
      cy.get('[data-cy=typing-indicator]').should('be.visible');
    });

    it('should validate message input', () => {
      // Try to send empty message
      cy.get('[data-cy=send-button]').should('be.disabled');
      
      // Type whitespace only
      cy.get('[data-cy=message-input]').type('   ');
      cy.get('[data-cy=send-button]').should('be.disabled');
      
      // Type valid message
      cy.get('[data-cy=message-input]').clear().type('This is a valid question');
      cy.get('[data-cy=send-button]').should('not.be.disabled');
    });

    it('should handle message sending errors', () => {
      // Mock send failure
      cy.intercept('POST', '**/api/qna/messages', {
        statusCode: 500,
        body: { message: 'Failed to process message' }
      }).as('sendMessageFailed');
      
      cy.get('[data-cy=message-input]').type('Test message');
      cy.get('[data-cy=send-button]').click();
      
      cy.wait('@sendMessageFailed');
      
      // Should show error message
      cy.get('[data-cy=error-message]').should('contain.text', 'Failed to process message');
      
      // Message should remain in input
      cy.get('[data-cy=message-input]').should('have.value', 'Test message');
    });

    it('should support keyboard shortcuts', () => {
      // Test Enter to send (without Shift)
      cy.get('[data-cy=message-input]').type('Test message{enter}');
      
      cy.wait('@sendMessage');
      
      // Should send message
      cy.get('[data-cy=message-input]').should('have.value', '');
      
      // Test Shift+Enter for new line
      cy.get('[data-cy=message-input]').type('Line 1{shift+enter}Line 2');
      cy.get('[data-cy=message-input]').should('contain.value', 'Line 1\nLine 2');
    });
  });

  describe('Document Selection', () => {
    beforeEach(() => {
      cy.visit('/qna/1');
      cy.wait('@getConversation');
      cy.wait('@getDocuments');
    });

    it('should display available documents', () => {
      cy.get('[data-cy=document-selector]').click();
      
      // Should show documents dropdown
      cy.get('[data-cy=documents-dropdown]').should('be.visible');
      cy.get('[data-cy=document-option]').should('have.length', 2);
      
      // Check document details
      cy.get('[data-cy=document-option]').first().within(() => {
        cy.get('[data-cy=document-title]').should('contain.text', 'Research Document');
        cy.get('[data-cy=document-status]').should('contain.text', 'PROCESSED');
      });
    });

    it('should select and deselect documents', () => {
      cy.get('[data-cy=document-selector]').click();
      
      // Select first document
      cy.get('[data-cy=document-option]').first().click();
      cy.get('[data-cy=selected-documents]').should('contain.text', 'Research Document');
      
      // Select second document
      cy.get('[data-cy=document-option]').eq(1).click();
      cy.get('[data-cy=selected-documents]').should('contain.text', 'Technical Manual');
      
      // Deselect first document
      cy.get('[data-cy=selected-document]').first().within(() => {
        cy.get('[data-cy=remove-document]').click();
      });
      
      cy.get('[data-cy=selected-documents]').should('not.contain.text', 'Research Document');
      cy.get('[data-cy=selected-documents]').should('contain.text', 'Technical Manual');
    });

    it('should filter documents by status', () => {
      cy.get('[data-cy=document-selector]').click();
      
      // Should only show processed documents by default
      cy.get('[data-cy=document-option]').should('have.length', 2);
      
      // Mock response with unprocessed documents
      cy.intercept('GET', '**/api/documents**', {
        statusCode: 200,
        body: {
          documents: [
            {
              id: 'doc1',
              title: 'Research Document',
              status: 'PROCESSED'
            },
            {
              id: 'doc3',
              title: 'Uploading Document',
              status: 'UPLOADED'
            }
          ]
        }
      }).as('getAllDocuments');
      
      // Refresh documents
      cy.get('[data-cy=refresh-documents]').click();
      cy.wait('@getAllDocuments');
      
      // Should still only show processed documents
      cy.get('[data-cy=document-option]').should('have.length', 1);
    });

    it('should handle empty documents state', () => {
      // Mock empty documents response
      cy.intercept('GET', '**/api/documents**', {
        statusCode: 200,
        body: { documents: [] }
      }).as('getEmptyDocuments');
      
      cy.reload();
      cy.wait('@getEmptyDocuments');
      
      cy.get('[data-cy=document-selector]').click();
      
      // Should show empty state
      cy.get('[data-cy=no-documents-message]').should('be.visible');
      cy.get('[data-cy=no-documents-message]').should('contain.text', 'No processed documents available');
    });
  });

  describe('Source Citations', () => {
    beforeEach(() => {
      cy.visit('/qna/1');
      cy.wait('@getConversation');
    });

    it('should display source citations correctly', () => {
      // Check source section
      cy.get('[data-cy=message-sources]').should('be.visible');
      cy.get('[data-cy=sources-title]').should('contain.text', 'Sources');
      
      // Check source item
      cy.get('[data-cy=source-item]').should('have.length', 1);
      cy.get('[data-cy=source-item]').first().within(() => {
        cy.get('[data-cy=source-content]').should('contain.text', 'The study shows a 25% improvement');
        cy.get('[data-cy=source-document]').should('be.visible');
      });
    });

    it('should expand and collapse source details', () => {
      // Click to expand source
      cy.get('[data-cy=source-item]').first().click();
      
      // Should show expanded content
      cy.get('[data-cy=source-expanded]').should('be.visible');
      cy.get('[data-cy=source-full-content]').should('be.visible');
      
      // Click again to collapse
      cy.get('[data-cy=source-item]').first().click();
      cy.get('[data-cy=source-expanded]').should('not.be.visible');
    });

    it('should handle messages without sources', () => {
      // Mock conversation with message without sources
      cy.intercept('GET', '**/api/qna/conversations/1', {
        statusCode: 200,
        body: {
          id: '1',
          title: 'No Sources Conversation',
          messages: [
            {
              id: '1',
              content: 'Hello!',
              role: 'user'
            },
            {
              id: '2',
              content: 'Hello! How can I help you today?',
              role: 'assistant',
              metadata: { sources: [] }
            }
          ]
        }
      }).as('getConversationNoSources');
      
      cy.reload();
      cy.wait('@getConversationNoSources');
      
      // Should not show sources section
      cy.get('[data-cy=message-sources]').should('not.exist');
    });
  });

  describe('Real-time Features', () => {
    beforeEach(() => {
      cy.visit('/qna/1');
      cy.wait('@getConversation');
    });

    it('should show typing indicator when processing', () => {
      cy.get('[data-cy=message-input]').type('Test question');
      cy.get('[data-cy=send-button]').click();
      
      // Should show typing indicator
      cy.get('[data-cy=typing-indicator]').should('be.visible');
      cy.get('[data-cy=typing-dots]').should('be.visible');
      
      cy.wait('@sendMessage');
      
      // Should hide typing indicator after response
      cy.get('[data-cy=typing-indicator]').should('not.exist');
    });

    it('should auto-scroll to new messages', () => {
      // Send multiple messages to create scroll
      for (let i = 0; i < 5; i++) {
        cy.get('[data-cy=message-input]').type(`Test message ${i + 1}`);
        cy.get('[data-cy=send-button]').click();
        cy.wait('@sendMessage');
      }
      
      // Should scroll to bottom
      cy.get('[data-cy=chat-messages]').should('be.visible');
      cy.get('[data-cy=message-item]').last().should('be.visible');
    });

    it('should handle connection errors gracefully', () => {
      // Mock network error
      cy.intercept('POST', '**/api/qna/messages', { forceNetworkError: true }).as('networkError');
      
      cy.get('[data-cy=message-input]').type('Test message');
      cy.get('[data-cy=send-button]').click();
      
      cy.wait('@networkError');
      
      // Should show retry option
      cy.get('[data-cy=retry-button]').should('be.visible');
      cy.get('[data-cy=error-message]').should('contain.text', 'Connection error');
    });
  });

  describe('Search and Filtering', () => {
    it('should search conversations', () => {
      cy.visit('/qna');
      cy.wait('@getConversations');
      
      // Type search query
      cy.get('[data-cy=search-conversations]').type('Document');
      
      // Should filter conversations
      cy.get('[data-cy=conversation-item]').should('have.length', 1);
      cy.get('[data-cy=conversation-title]').should('contain.text', 'Document Analysis');
      
      // Clear search
      cy.get('[data-cy=clear-search]').click();
      cy.get('[data-cy=conversation-item]').should('have.length', 2);
    });

    it('should search within conversation messages', () => {
      cy.visit('/qna/1');
      cy.wait('@getConversation');
      
      // Open search in conversation
      cy.get('[data-cy=search-messages]').click();
      cy.get('[data-cy=message-search-input]').type('key findings');
      
      // Should highlight matching messages
      cy.get('[data-cy=highlighted-message]').should('have.length', 1);
      cy.get('[data-cy=search-results]').should('contain.text', '1 result found');
      
      // Test navigation between results
      cy.get('[data-cy=next-result]').should('be.visible');
      cy.get('[data-cy=prev-result]').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', () => {
      cy.visit('/qna');
      cy.wait('@getConversations');
      
      // Test tab navigation
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-cy', 'new-conversation-button');
      
      // Navigate to conversations list
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-cy').and('include', 'conversation-item');
      
      // Test Enter to select conversation
      cy.focused().type('{enter}');
      cy.url().should('include', '/qna/1');
    });

    it('should have proper ARIA labels', () => {
      cy.visit('/qna/1');
      cy.wait('@getConversation');
      
      // Check ARIA labels
      cy.get('[data-cy=chat-messages]').should('have.attr', 'aria-label', 'Chat messages');
      cy.get('[data-cy=message-input]').should('have.attr', 'aria-label', 'Type your message');
      cy.get('[data-cy=send-button]').should('have.attr', 'aria-label', 'Send message');
      cy.get('[data-cy=document-selector]').should('have.attr', 'aria-label', 'Select documents');
    });

    it('should support screen readers', () => {
      cy.visit('/qna/1');
      cy.wait('@getConversation');
      
      // Check semantic structure
      cy.get('[data-cy=user-message]').should('have.attr', 'role', 'article');
      cy.get('[data-cy=assistant-message]').should('have.attr', 'role', 'article');
      
      // Check live regions for announcements
      cy.get('[data-cy=status-announcements]').should('have.attr', 'aria-live', 'polite');
    });
  });

  describe('Performance', () => {
    it('should handle large conversations efficiently', () => {
      // Mock large conversation
      const largeConversation = {
        id: '1',
        title: 'Large Conversation',
        messages: Array.from({ length: 100 }, (_, i) => ({
          id: `${i + 1}`,
          content: `Message ${i + 1}`,
          role: i % 2 === 0 ? 'user' : 'assistant',
          createdAt: new Date(Date.now() - (100 - i) * 60000).toISOString()
        }))
      };
      
      cy.intercept('GET', '**/api/qna/conversations/1', {
        statusCode: 200,
        body: largeConversation
      }).as('getLargeConversation');
      
      cy.visit('/qna/1');
      cy.wait('@getLargeConversation');
      
      // Should load efficiently
      cy.get('[data-cy=message-item]').should('have.length', 100);
      
      // Should handle scrolling smoothly
      cy.get('[data-cy=chat-messages]').scrollTo('top');
      cy.get('[data-cy=message-item]').first().should('be.visible');
    });

    it('should implement message virtualization for very large conversations', () => {
      // This would test virtual scrolling implementation
      // In a real app, you'd have virtualization for 1000+ messages
      cy.visit('/qna/1');
      cy.wait('@getConversation');
      
      // Check that DOM doesn't contain excessive elements
      cy.get('[data-cy=message-item]').should('have.length.lessThan', 50);
    });
  });
});