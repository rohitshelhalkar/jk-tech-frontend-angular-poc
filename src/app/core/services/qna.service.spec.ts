import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { QnaService } from './qna.service';
import { environment } from '@environments/environment';
import { 
  Conversation, 
  ConversationResponse, 
  CreateConversationRequest,
  SendMessageRequest,
  SendMessageResponse,
  ConversationsQuery,
  Message
} from '../models/qna.model';

describe('QnaService', () => {
  let service: QnaService;
  let httpMock: HttpTestingController;

  const mockConversation: Conversation = {
    id: '1',
    title: 'Test Conversation',
    userId: 'user1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    messages: []
  };

  const mockMessage: Message = {
    id: '1',
    conversationId: '1',
    userId: 'user1',
    content: 'Test message',
    role: 'user',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  const mockAssistantMessage: Message = {
    id: '2',
    conversationId: '1',
    userId: 'user1',
    content: 'Assistant response',
    role: 'assistant',
    metadata: {
      sources: [
        {
          documentId: 'doc1',
          chunkId: 'chunk1',
          content: 'Source content...'
        }
      ],
      tokensUsed: 150,
      model: 'test-model',
      processingTime: 500
    },
    createdAt: '2024-01-01T00:01:00Z',
    updatedAt: '2024-01-01T00:01:00Z'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [QnaService]
    });

    service = TestBed.inject(QnaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createConversation', () => {
    it('should create a new conversation', () => {
      const createRequest: CreateConversationRequest = { title: 'New Conversation' };

      service.createConversation(createRequest).subscribe(conversation => {
        expect(conversation).toEqual(mockConversation);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/qna/conversations`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createRequest);
      req.flush(mockConversation);
    });

    it('should handle creation error', () => {
      const createRequest: CreateConversationRequest = { title: 'New Conversation' };

      service.createConversation(createRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/qna/conversations`);
      req.flush({ message: 'Bad Request' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('getConversations', () => {
    const mockConversationResponse: ConversationResponse = {
      conversations: [mockConversation],
      total: 1,
      limit: 20,
      offset: 0
    };

    it('should get conversations with default parameters', () => {
      service.getConversations().subscribe(response => {
        expect(response).toEqual(mockConversationResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/qna/conversations`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockConversationResponse);
    });

    it('should get conversations with query parameters', () => {
      const query: ConversationsQuery = {
        limit: 10,
        offset: 5,
        search: 'test'
      };

      service.getConversations(query).subscribe(response => {
        expect(response).toEqual(mockConversationResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/qna/conversations?limit=10&offset=5&search=test`);
      expect(req.request.method).toBe('GET');
      req.flush(mockConversationResponse);
    });

    it('should handle get conversations error', () => {
      service.getConversations().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/qna/conversations`);
      req.flush({ message: 'Server Error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getConversation', () => {
    const conversationWithMessages = {
      ...mockConversation,
      messages: [mockMessage, mockAssistantMessage]
    };

    it('should get conversation by id', () => {
      service.getConversation('1').subscribe(conversation => {
        expect(conversation).toEqual(conversationWithMessages);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/qna/conversations/1`);
      expect(req.request.method).toBe('GET');
      req.flush(conversationWithMessages);
    });

    it('should handle conversation not found', () => {
      service.getConversation('999').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/qna/conversations/999`);
      req.flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('sendMessage', () => {
    const mockSendResponse: SendMessageResponse = {
      userMessage: mockMessage,
      assistantMessage: mockAssistantMessage
    };

    it('should send message and get response', () => {
      const sendRequest: SendMessageRequest = {
        content: 'Test message',
        conversationId: '1',
        documentIds: ['doc1', 'doc2']
      };

      service.sendMessage(sendRequest).subscribe(response => {
        expect(response).toEqual(mockSendResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/qna/messages`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(sendRequest);
      req.flush(mockSendResponse);
    });

    it('should send message without document IDs', () => {
      const sendRequest: SendMessageRequest = {
        content: 'Test message',
        conversationId: '1'
      };

      service.sendMessage(sendRequest).subscribe(response => {
        expect(response).toEqual(mockSendResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/qna/messages`);
      expect(req.request.body).toEqual(sendRequest);
      req.flush(mockSendResponse);
    });

    it('should handle send message error', () => {
      const sendRequest: SendMessageRequest = {
        content: 'Test message',
        conversationId: '999'
      };

      service.sendMessage(sendRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/qna/messages`);
      req.flush({ message: 'Conversation not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('updateConversationTitle', () => {
    it('should update conversation title', () => {
      const updatedConversation = { ...mockConversation, title: 'Updated Title' };

      service.updateConversationTitle('1', 'Updated Title').subscribe(conversation => {
        expect(conversation).toEqual(updatedConversation);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/qna/conversations/1/title`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ title: 'Updated Title' });
      req.flush(updatedConversation);
    });

    it('should handle update title error', () => {
      service.updateConversationTitle('999', 'New Title').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/qna/conversations/999/title`);
      req.flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('deleteConversation', () => {
    it('should delete conversation', () => {
      const deleteResponse = { message: 'Conversation deleted successfully' };

      service.deleteConversation('1').subscribe(response => {
        expect(response).toEqual(deleteResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/qna/conversations/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(deleteResponse);
    });

    it('should handle delete error', () => {
      service.deleteConversation('999').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/qna/conversations/999`);
      req.flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });
    });
  });
});