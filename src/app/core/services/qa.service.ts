import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { 
  QARequest, 
  QAResponse, 
  QAHistory, 
  QAHistoryResponse 
} from '../models/qa.model';

@Injectable({
  providedIn: 'root'
})
export class QAService {
  private readonly API_URL = environment.apiUrl + '/qa'; // Assuming QA endpoint

  constructor(private http: HttpClient) {}

  askQuestion(request: QARequest): Observable<QAResponse> {
    return this.http.post<QAResponse>(`${this.API_URL}/ask`, request)
      .pipe(catchError(this.handleError));
  }

  getQAHistory(page?: number, limit?: number): Observable<QAHistoryResponse> {
    let params = new HttpParams();
    if (page) params = params.set('page', page.toString());
    if (limit) params = params.set('limit', limit.toString());

    return this.http.get<QAHistoryResponse>(`${this.API_URL}/history`, { params })
      .pipe(catchError(this.handleError));
  }

  deleteQAHistory(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/history/${id}`)
      .pipe(catchError(this.handleError));
  }

  clearAllHistory(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/history`)
      .pipe(catchError(this.handleError));
  }

  // Utility methods
  getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return 'accent';
    if (confidence >= 0.6) return 'primary';
    if (confidence >= 0.4) return 'warn';
    return 'warn';
  }

  getConfidenceText(confidence: number): string {
    if (confidence >= 0.9) return 'Very High';
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    if (confidence >= 0.4) return 'Low';
    return 'Very Low';
  }

  formatProcessingTime(timeMs: number): string {
    if (timeMs < 1000) {
      return `${timeMs}ms`;
    } else {
      return `${(timeMs / 1000).toFixed(2)}s`;
    }
  }

  highlightSearchTerms(text: string, searchTerms: string[]): string {
    let highlightedText = text;
    searchTerms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    });
    return highlightedText;
  }

  extractKeywords(question: string): string[] {
    // Simple keyword extraction - remove common words
    const commonWords = ['what', 'how', 'when', 'where', 'why', 'who', 'is', 'are', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    return question
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(' ')
      .filter(word => word.length > 2 && !commonWords.includes(word));
  }

  private handleError(error: any): Observable<never> {
    console.error('QA service error:', error);
    return throwError(() => error);
  }
}