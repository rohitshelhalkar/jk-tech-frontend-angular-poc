import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { IngestionService } from './ingestion.service';
import { environment } from '@environments/environment';
import { 
  IngestionJob, 
  IngestionJobsResponse, 
  TriggerIngestionRequest, 
  IngestionJobsQuery,
  IngestionStatus 
} from '../models/ingestion.model';

describe('IngestionService', () => {
  let service: IngestionService;
  let httpMock: HttpTestingController;

  const mockIngestionJob: IngestionJob = {
    id: 'job-1',
    documentId: 'doc-1',
    userId: 'user-1',
    status: IngestionStatus.PENDING,
    documentName: 'Test Document.pdf',
    startedAt: '2024-01-01T10:00:00Z',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
    document: {
      id: 'doc-1',
      filename: 'test-doc.pdf',
      originalName: 'Test Document.pdf',
      title: 'Test Document'
    },
    user: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com'
    }
  };

  const mockCompletedJob: IngestionJob = {
    ...mockIngestionJob,
    id: 'job-2',
    status: IngestionStatus.COMPLETED,
    completedAt: '2024-01-01T10:02:30Z'
  };

  const mockFailedJob: IngestionJob = {
    ...mockIngestionJob,
    id: 'job-3',
    status: IngestionStatus.FAILED,
    errorMessage: 'Processing failed due to corrupted file',
    completedAt: '2024-01-01T10:01:15Z'
  };

  const mockJobsResponse: IngestionJobsResponse = {
    jobs: [mockIngestionJob, mockCompletedJob, mockFailedJob],
    pagination: {
      total: 3,
      page: 1,
      limit: 10,
      pages: 1
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [IngestionService]
    });

    service = TestBed.inject(IngestionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    service.stopPollingJobStatus(); // Clean up any ongoing polling
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getIngestionJobs', () => {
    it('should get ingestion jobs with default parameters', () => {
      service.getIngestionJobs().subscribe(response => {
        expect(response).toEqual(mockJobsResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.ingestion}`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockJobsResponse);
    });

    it('should get ingestion jobs with pagination parameters', () => {
      const query: IngestionJobsQuery = { page: 2, limit: 5 };

      service.getIngestionJobs(query).subscribe(response => {
        expect(response).toEqual(mockJobsResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.ingestion}?page=2&limit=5`);
      expect(req.request.method).toBe('GET');
      req.flush(mockJobsResponse);
    });

    it('should get ingestion jobs with status filter', () => {
      const query: IngestionJobsQuery = { status: IngestionStatus.COMPLETED };

      service.getIngestionJobs(query).subscribe(response => {
        expect(response).toEqual(mockJobsResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.ingestion}?status=COMPLETED`);
      expect(req.request.method).toBe('GET');
      req.flush(mockJobsResponse);
    });

    it('should get ingestion jobs with all parameters', () => {
      const query: IngestionJobsQuery = { page: 1, limit: 20, status: IngestionStatus.FAILED };

      service.getIngestionJobs(query).subscribe(response => {
        expect(response).toEqual(mockJobsResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.ingestion}?page=1&limit=20&status=FAILED`);
      req.flush(mockJobsResponse);
    });

    it('should handle get ingestion jobs error', () => {
      service.getIngestionJobs().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(403);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.ingestion}`);
      req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });
    });
  });

  describe('getIngestionJob', () => {
    it('should get ingestion job by id', () => {
      service.getIngestionJob('job-1').subscribe(job => {
        expect(job).toEqual(mockIngestionJob);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.ingestion}/job-1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockIngestionJob);
    });

    it('should handle job not found', () => {
      service.getIngestionJob('non-existent').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.ingestion}/non-existent`);
      req.flush({ message: 'Job not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('triggerIngestion', () => {
    it('should trigger ingestion for document', () => {
      const triggerRequest: TriggerIngestionRequest = { documentId: 'doc-1' };

      service.triggerIngestion(triggerRequest).subscribe(job => {
        expect(job).toEqual(mockIngestionJob);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.ingestion}/trigger`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(triggerRequest);
      req.flush(mockIngestionJob);
    });

    it('should handle trigger ingestion error', () => {
      const triggerRequest: TriggerIngestionRequest = { documentId: 'invalid-doc' };

      service.triggerIngestion(triggerRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.ingestion}/trigger`);
      req.flush({ message: 'Document not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('polling functionality', () => {
    beforeEach(() => {
      // Override the polling interval for faster tests
      (service as any).POLLING_INTERVAL = 100; // 100ms for testing
    });

    it('should start polling job status', fakeAsync(() => {
      let receivedJobs: IngestionJob[] = [];
      
      service.startPollingJobStatus('job-1').subscribe(job => {
        receivedJobs.push(job);
      });

      // First poll (immediate)
      tick(0);
      let req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.ingestion}/job-1`);
      req.flush(mockIngestionJob);

      // Second poll after interval
      tick(100);
      req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.ingestion}/job-1`);
      req.flush(mockCompletedJob);

      // Third poll after interval
      tick(100);
      req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.ingestion}/job-1`);
      req.flush(mockCompletedJob);

      expect(receivedJobs.length).toBe(3);
      expect(receivedJobs[0]).toEqual(mockIngestionJob);
      expect(receivedJobs[1]).toEqual(mockCompletedJob);
      expect(receivedJobs[2]).toEqual(mockCompletedJob);

      service.stopPollingJobStatus();
    }));

    it('should stop polling when stopPollingJobStatus is called', fakeAsync(() => {
      let receivedJobs: IngestionJob[] = [];
      
      service.startPollingJobStatus('job-1').subscribe(job => {
        receivedJobs.push(job);
      });

      // First poll
      tick(0);
      let req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.ingestion}/job-1`);
      req.flush(mockIngestionJob);

      // Stop polling
      service.stopPollingJobStatus();

      // Advance time - no more requests should be made
      tick(200);
      httpMock.expectNone(`${environment.apiUrl}${environment.apiEndpoints.ingestion}/job-1`);

      expect(receivedJobs.length).toBe(1);
    }));

    it('should start polling jobs list', fakeAsync(() => {
      let receivedResponses: IngestionJobsResponse[] = [];
      const query: IngestionJobsQuery = { status: IngestionStatus.PENDING };
      
      service.startPollingJobsList(query).subscribe(response => {
        receivedResponses.push(response);
      });

      // First poll (immediate)
      tick(0);
      let req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.ingestion}?status=PENDING`);
      req.flush(mockJobsResponse);

      // Second poll after interval
      tick(100);
      req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.ingestion}?status=PENDING`);
      req.flush(mockJobsResponse);

      expect(receivedResponses.length).toBe(2);
      expect(receivedResponses[0]).toEqual(mockJobsResponse);
      expect(receivedResponses[1]).toEqual(mockJobsResponse);

      service.stopPollingJobStatus();
    }));
  });

  describe('utility methods', () => {
    describe('getStatusColor', () => {
      it('should return correct colors for different statuses', () => {
        expect(service.getStatusColor(IngestionStatus.PENDING)).toBe('primary');
        expect(service.getStatusColor(IngestionStatus.COMPLETED)).toBe('accent');
        expect(service.getStatusColor(IngestionStatus.FAILED)).toBe('warn');
      });
    });

    describe('getStatusIcon', () => {
      it('should return correct icons for different statuses', () => {
        expect(service.getStatusIcon(IngestionStatus.PENDING)).toBe('schedule');
        expect(service.getStatusIcon(IngestionStatus.COMPLETED)).toBe('check_circle');
        expect(service.getStatusIcon(IngestionStatus.FAILED)).toBe('error');
      });

      it('should return default icon for unknown status', () => {
        expect(service.getStatusIcon('UNKNOWN' as IngestionStatus)).toBe('help');
      });
    });

    describe('getStatusClass', () => {
      it('should return correct CSS classes for different statuses', () => {
        expect(service.getStatusClass(IngestionStatus.PENDING)).toBe('status-badge status-pending');
        expect(service.getStatusClass(IngestionStatus.COMPLETED)).toBe('status-badge status-completed');
        expect(service.getStatusClass(IngestionStatus.FAILED)).toBe('status-badge status-failed');
      });
    });

    describe('isJobInProgress', () => {
      it('should correctly identify jobs in progress', () => {
        expect(service.isJobInProgress(IngestionStatus.PENDING)).toBe(true);
        expect(service.isJobInProgress(IngestionStatus.COMPLETED)).toBe(false);
        expect(service.isJobInProgress(IngestionStatus.FAILED)).toBe(false);
      });
    });

    describe('isJobCompleted', () => {
      it('should correctly identify completed jobs', () => {
        expect(service.isJobCompleted(IngestionStatus.PENDING)).toBe(false);
        expect(service.isJobCompleted(IngestionStatus.COMPLETED)).toBe(true);
        expect(service.isJobCompleted(IngestionStatus.FAILED)).toBe(true);
      });
    });

    describe('getJobDuration', () => {
      it('should return N/A when no start time', () => {
        expect(service.getJobDuration()).toBe('N/A');
        expect(service.getJobDuration(undefined)).toBe('N/A');
      });

      it('should calculate duration in seconds', () => {
        const startTime = '2024-01-01T10:00:00Z';
        const endTime = '2024-01-01T10:00:30Z';
        expect(service.getJobDuration(startTime, endTime)).toBe('30s');
      });

      it('should calculate duration in minutes and seconds', () => {
        const startTime = '2024-01-01T10:00:00Z';
        const endTime = '2024-01-01T10:02:30Z';
        expect(service.getJobDuration(startTime, endTime)).toBe('2m 30s');
      });

      it('should calculate duration in hours, minutes and seconds', () => {
        const startTime = '2024-01-01T10:00:00Z';
        const endTime = '2024-01-01T12:05:45Z';
        expect(service.getJobDuration(startTime, endTime)).toBe('2h 5m 45s');
      });

      it('should use current time when no end time provided', () => {
        const startTime = new Date(Date.now() - 65000).toISOString(); // 65 seconds ago
        const duration = service.getJobDuration(startTime);
        expect(duration).toMatch(/1m \d+s/); // Should be around 1m 5s
      });

      it('should handle edge cases', () => {
        const startTime = '2024-01-01T10:00:00Z';
        const endTime = '2024-01-01T10:00:00Z'; // Same time
        expect(service.getJobDuration(startTime, endTime)).toBe('0s');
      });
    });
  });

  describe('error handling', () => {
    it('should handle network errors', () => {
      spyOn(console, 'error');

      service.getIngestionJobs().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeDefined();
          expect(console.error).toHaveBeenCalledWith('Ingestion service error:', error);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.ingestion}`);
      req.error(new ErrorEvent('Network error'));
    });

    it('should handle server errors', () => {
      spyOn(console, 'error');

      service.getIngestionJob('job-1').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(console.error).toHaveBeenCalledWith('Ingestion service error:', error);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.ingestion}/job-1`);
      req.flush({ message: 'Internal Server Error' }, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle polling errors gracefully', fakeAsync(() => {
      spyOn(console, 'error');
      let errorReceived = false;

      service.startPollingJobStatus('job-1').subscribe({
        next: () => {},
        error: (error) => {
          errorReceived = true;
          expect(console.error).toHaveBeenCalledWith('Ingestion service error:', error);
        }
      });

      tick(0);
      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.ingestion}/job-1`);
      req.error(new ErrorEvent('Network error'));

      expect(errorReceived).toBe(true);
      service.stopPollingJobStatus();
    }));
  });

  describe('edge cases and boundary conditions', () => {
    it('should handle empty jobs response', () => {
      const emptyResponse: IngestionJobsResponse = {
        jobs: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          pages: 0
        }
      };

      service.getIngestionJobs().subscribe(response => {
        expect(response).toEqual(emptyResponse);
        expect(response.jobs.length).toBe(0);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.ingestion}`);
      req.flush(emptyResponse);
    });

    it('should handle malformed job data', () => {
      const malformedJob = {
        id: 'malformed-job',
        // Missing required fields
      } as any;

      service.getIngestionJob('malformed-job').subscribe(job => {
        expect(job).toEqual(malformedJob);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.ingestion}/malformed-job`);
      req.flush(malformedJob);
    });

    it('should handle very long durations', () => {
      const startTime = '2024-01-01T00:00:00Z';
      const endTime = '2024-01-02T10:05:30Z'; // More than 24 hours
      const duration = service.getJobDuration(startTime, endTime);
      expect(duration).toMatch(/\d+h \d+m \d+s/);
      expect(duration).toContain('34h'); // Should be 34 hours and some minutes/seconds
    });

    it('should handle invalid date strings gracefully', () => {
      const duration = service.getJobDuration('invalid-date', 'another-invalid-date');
      expect(duration).toBe('NaNs'); // JavaScript Date behavior with invalid strings
    });

    it('should handle multiple stop polling calls', () => {
      expect(() => {
        service.stopPollingJobStatus();
        service.stopPollingJobStatus();
        service.stopPollingJobStatus();
      }).not.toThrow();
    });

    it('should handle query with status ALL', () => {
      const query: IngestionJobsQuery = { status: 'ALL' };

      service.getIngestionJobs(query).subscribe(response => {
        expect(response).toEqual(mockJobsResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.ingestion}?status=ALL`);
      req.flush(mockJobsResponse);
    });
  });
});