import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError, timer, switchMap, takeUntil, Subject } from 'rxjs';
import { environment } from '@environments/environment';
import { 
  IngestionJob, 
  IngestionJobsResponse, 
  TriggerIngestionRequest, 
  IngestionJobsQuery,
  IngestionStatus 
} from '../models/ingestion.model';

@Injectable({
  providedIn: 'root'
})
export class IngestionService {
  private readonly API_URL = environment.apiUrl + environment.apiEndpoints.ingestion;
  private readonly POLLING_INTERVAL = environment.polling.ingestionStatusInterval;
  
  private stopPolling$ = new Subject<void>();

  constructor(private http: HttpClient) {}

  getIngestionJobs(query?: IngestionJobsQuery): Observable<IngestionJobsResponse> {
    let params = new HttpParams();
    if (query?.page) params = params.set('page', query.page.toString());
    if (query?.limit) params = params.set('limit', query.limit.toString());
    if (query?.status) params = params.set('status', query.status);

    return this.http.get<IngestionJobsResponse>(this.API_URL, { params })
      .pipe(catchError(this.handleError));
  }

  getIngestionJob(jobId: string): Observable<IngestionJob> {
    return this.http.get<IngestionJob>(`${this.API_URL}/${jobId}`)
      .pipe(catchError(this.handleError));
  }

  triggerIngestion(request: TriggerIngestionRequest): Observable<IngestionJob> {
    return this.http.post<IngestionJob>(`${this.API_URL}/trigger`, request)
      .pipe(catchError(this.handleError));
  }

  // Polling service for real-time updates
  startPollingJobStatus(jobId: string): Observable<IngestionJob> {
    return timer(0, this.POLLING_INTERVAL).pipe(
      switchMap(() => this.getIngestionJob(jobId)),
      takeUntil(this.stopPolling$),
      catchError(this.handleError)
    );
  }

  stopPollingJobStatus(): void {
    this.stopPolling$.next();
  }

  startPollingJobsList(query?: IngestionJobsQuery): Observable<IngestionJobsResponse> {
    return timer(0, this.POLLING_INTERVAL).pipe(
      switchMap(() => this.getIngestionJobs(query)),
      takeUntil(this.stopPolling$),
      catchError(this.handleError)
    );
  }

  // Utility methods
  getStatusColor(status: IngestionStatus): string {
    switch (status) {
      case IngestionStatus.PENDING:
        return 'warn';
      case IngestionStatus.PROCESSING:
        return 'primary';
      case IngestionStatus.COMPLETED:
        return 'accent';
      case IngestionStatus.FAILED:
        return 'warn';
      default:
        return 'primary';
    }
  }

  getStatusIcon(status: IngestionStatus): string {
    switch (status) {
      case IngestionStatus.PENDING:
        return 'schedule';
      case IngestionStatus.PROCESSING:
        return 'sync';
      case IngestionStatus.COMPLETED:
        return 'check_circle';
      case IngestionStatus.FAILED:
        return 'error';
      default:
        return 'help';
    }
  }

  getStatusClass(status: IngestionStatus): string {
    return `status-badge status-${status.toLowerCase()}`;
  }

  isJobInProgress(status: IngestionStatus): boolean {
    return status === IngestionStatus.PENDING || status === IngestionStatus.PROCESSING;
  }

  isJobCompleted(status: IngestionStatus): boolean {
    return status === IngestionStatus.COMPLETED || status === IngestionStatus.FAILED;
  }

  getJobDuration(startedAt?: string, completedAt?: string): string {
    if (!startedAt) return 'N/A';
    
    const start = new Date(startedAt).getTime();
    const end = completedAt ? new Date(completedAt).getTime() : Date.now();
    const duration = end - start;
    
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  private handleError(error: any): Observable<never> {
    console.error('Ingestion service error:', error);
    return throwError(() => error);
  }
}