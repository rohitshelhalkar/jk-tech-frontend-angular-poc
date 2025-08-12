import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import {
  Conversation,
  ConversationResponse,
  CreateConversationRequest,
  SendMessageRequest,
  SendMessageResponse,
  ConversationsQuery
} from '../models/qna.model';

@Injectable({
  providedIn: 'root'
})
export class QnaService {
  private readonly API_URL = environment.apiUrl + '/qna';

  constructor(private http: HttpClient) {}

  createConversation(data: CreateConversationRequest): Observable<Conversation> {
    return this.http.post<Conversation>(`${this.API_URL}/conversations`, data)
      .pipe(catchError(this.handleError));
  }

  getConversations(query: ConversationsQuery = {}): Observable<ConversationResponse> {
    let params = new HttpParams();
    
    if (query.limit) {
      params = params.set('limit', query.limit.toString());
    }
    
    if (query.offset) {
      params = params.set('offset', query.offset.toString());
    }
    
    if (query.search) {
      params = params.set('search', query.search);
    }

    return this.http.get<ConversationResponse>(`${this.API_URL}/conversations`, { params })
      .pipe(catchError(this.handleError));
  }

  getConversation(conversationId: string): Observable<Conversation> {
    return this.http.get<Conversation>(`${this.API_URL}/conversations/${conversationId}`)
      .pipe(catchError(this.handleError));
  }

  sendMessage(data: SendMessageRequest): Observable<SendMessageResponse> {
    return this.http.post<SendMessageResponse>(`${this.API_URL}/messages`, data)
      .pipe(catchError(this.handleError));
  }

  updateConversationTitle(conversationId: string, title: string): Observable<Conversation> {
    return this.http.put<Conversation>(`${this.API_URL}/conversations/${conversationId}/title`, { title })
      .pipe(catchError(this.handleError));
  }

  deleteConversation(conversationId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/conversations/${conversationId}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any): Observable<never> {
    console.error('QnA service error:', error);
    return throwError(() => error);
  }
}