import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { 
  Document, 
  DocumentsResponse, 
  CreateDocumentRequest, 
  UpdateDocumentRequest, 
  PaginationQuery, 
  DocumentListResponse
} from '../models/document.model';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private readonly API_URL = environment.apiUrl + environment.apiEndpoints.documents;

  constructor(private http: HttpClient) {}

  getDocuments(query?: PaginationQuery): Observable<DocumentListResponse> {
    let params = new HttpParams();
    if (query?.page) params = params.set('page', query.page.toString());
    if (query?.limit) params = params.set('limit', query.limit.toString());

    return this.http.get<DocumentListResponse>(this.API_URL, { params })
      .pipe(catchError(this.handleError));
  }

  getDocument(id: string): Observable<Document> {
    return this.http.get<Document>(`${this.API_URL}/${id}`)
      .pipe(catchError(this.handleError));
  }

  uploadDocument(request: CreateDocumentRequest): Observable<Document> {
    const formData = new FormData();
    formData.append('file', request.file);
    if (request.title) formData.append('title', request.title);
    if (request.description) formData.append('description', request.description);

    return this.http.post<Document>(this.API_URL, formData)
      .pipe(catchError(this.handleError));
  }

  updateDocument(id: string, request: UpdateDocumentRequest): Observable<Document> {
    return this.http.patch<Document>(`${this.API_URL}/${id}`, request)
      .pipe(catchError(this.handleError));
  }

  deleteDocument(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/${id}`)
      .pipe(catchError(this.handleError));
  }

  downloadDocument(id: string): Observable<Blob> {
    return this.http.get(`${this.API_URL}/${id}/download`, { 
      responseType: 'blob' 
    }).pipe(catchError(this.handleError));
  }

  getDocumentDownloadUrl(id: string): string {
    return `${this.API_URL}/${id}/download`;
  }

  triggerIngestion(id: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/${id}/ingest`, {})
      .pipe(catchError(this.handleError));
  }

  // Utility methods
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIcon(mimetype: string): string {
    if (mimetype.includes('pdf')) return 'picture_as_pdf';
    if (mimetype.includes('word')) return 'description';
    if (mimetype.includes('text')) return 'article';
    if (mimetype.includes('image')) return 'image';
    return 'insert_drive_file';
  }

  isValidFileType(file: File): boolean {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    return allowedTypes.includes(file.type);
  }

  private handleError(error: any): Observable<never> {
    console.error('Document service error:', error);
    return throwError(() => error);
  }
}