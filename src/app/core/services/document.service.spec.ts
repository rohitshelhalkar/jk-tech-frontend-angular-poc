import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DocumentService } from './document.service';
import { environment } from '@environments/environment';
import { 
  Document, 
  DocumentListResponse, 
  CreateDocumentRequest, 
  UpdateDocumentRequest, 
  PaginationQuery,
  DocumentStatus
} from '../models/document.model';

describe('DocumentService', () => {
  let service: DocumentService;
  let httpMock: HttpTestingController;

  const mockDocument: Document = {
    id: '1',
    filename: 'test-doc.pdf',
    originalName: 'Test Document.pdf',
    mimetype: 'application/pdf',
    size: 1024000,
    filePath: '/uploads/test-doc.pdf',
    title: 'Test Document',
    description: 'Test description',
    status: DocumentStatus.PROCESSED,
    uploadedBy: 'user1',
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    user: {
      id: 'user1',
      name: 'Test User',
      email: 'test@example.com'
    }
  };

  const mockDocumentListResponse: DocumentListResponse = {
    documents: [mockDocument],
    pagination: {
      total: 1,
      page: 1,
      limit: 10,
      pages: 1
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DocumentService]
    });

    service = TestBed.inject(DocumentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getDocuments', () => {
    it('should get documents with default parameters', () => {
      service.getDocuments().subscribe(response => {
        expect(response).toEqual(mockDocumentListResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.documents}`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockDocumentListResponse);
    });

    it('should get documents with pagination parameters', () => {
      const query: PaginationQuery = { page: 2, limit: 5 };

      service.getDocuments(query).subscribe(response => {
        expect(response).toEqual(mockDocumentListResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.documents}?page=2&limit=5`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDocumentListResponse);
    });

    it('should handle partial query parameters', () => {
      const query: PaginationQuery = { page: 3 };

      service.getDocuments(query).subscribe(response => {
        expect(response).toEqual(mockDocumentListResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.documents}?page=3`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDocumentListResponse);
    });

    it('should handle get documents error', () => {
      service.getDocuments().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.documents}`);
      req.flush({ message: 'Server Error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getDocument', () => {
    it('should get document by id', () => {
      service.getDocument('1').subscribe(document => {
        expect(document).toEqual(mockDocument);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.documents}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDocument);
    });

    it('should handle document not found', () => {
      service.getDocument('999').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.documents}/999`);
      req.flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('uploadDocument', () => {
    let mockFile: File;

    beforeEach(() => {
      mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    });

    it('should upload document with all fields', () => {
      const uploadRequest: CreateDocumentRequest = {
        file: mockFile,
        title: 'Test Title',
        description: 'Test Description'
      };

      service.uploadDocument(uploadRequest).subscribe(document => {
        expect(document).toEqual(mockDocument);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.documents}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeInstanceOf(FormData);
      
      const formData = req.request.body as FormData;
      expect(formData.get('file')).toBe(mockFile);
      expect(formData.get('title')).toBe('Test Title');
      expect(formData.get('description')).toBe('Test Description');
      
      req.flush(mockDocument);
    });

    it('should upload document with only file', () => {
      const uploadRequest: CreateDocumentRequest = {
        file: mockFile
      };

      service.uploadDocument(uploadRequest).subscribe(document => {
        expect(document).toEqual(mockDocument);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.documents}`);
      const formData = req.request.body as FormData;
      expect(formData.get('file')).toBe(mockFile);
      expect(formData.get('title')).toBeNull();
      expect(formData.get('description')).toBeNull();
      
      req.flush(mockDocument);
    });

    it('should handle upload error', () => {
      const uploadRequest: CreateDocumentRequest = {
        file: mockFile
      };

      service.uploadDocument(uploadRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(413);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.documents}`);
      req.flush({ message: 'File too large' }, { status: 413, statusText: 'Payload Too Large' });
    });
  });

  describe('updateDocument', () => {
    it('should update document', () => {
      const updateRequest: UpdateDocumentRequest = {
        title: 'Updated Title',
        description: 'Updated Description'
      };

      const updatedDocument = { ...mockDocument, ...updateRequest };

      service.updateDocument('1', updateRequest).subscribe(document => {
        expect(document).toEqual(updatedDocument);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.documents}/1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(updateRequest);
      req.flush(updatedDocument);
    });

    it('should update document with partial data', () => {
      const updateRequest: UpdateDocumentRequest = {
        title: 'New Title Only'
      };

      const updatedDocument = { ...mockDocument, title: 'New Title Only' };

      service.updateDocument('1', updateRequest).subscribe(document => {
        expect(document).toEqual(updatedDocument);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.documents}/1`);
      expect(req.request.body).toEqual(updateRequest);
      req.flush(updatedDocument);
    });

    it('should handle update error', () => {
      const updateRequest: UpdateDocumentRequest = {
        title: 'Test Title'
      };

      service.updateDocument('999', updateRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.documents}/999`);
      req.flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('deleteDocument', () => {
    it('should delete document', () => {
      const deleteResponse = { message: 'Document deleted successfully' };

      service.deleteDocument('1').subscribe(response => {
        expect(response).toEqual(deleteResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.documents}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(deleteResponse);
    });

    it('should handle delete error', () => {
      service.deleteDocument('999').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.documents}/999`);
      req.flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('downloadDocument', () => {
    it('should download document as blob', () => {
      const mockBlob = new Blob(['file content'], { type: 'application/pdf' });

      service.downloadDocument('1').subscribe(blob => {
        expect(blob).toBeInstanceOf(Blob);
        expect(blob.type).toBe('application/pdf');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.documents}/1/download`);
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });

    it('should handle download error', () => {
      service.downloadDocument('999').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.documents}/999/download`);
      req.flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getDocumentDownloadUrl', () => {
    it('should return correct download URL', () => {
      const expectedUrl = `${environment.apiUrl}${environment.apiEndpoints.documents}/1/download`;
      const actualUrl = service.getDocumentDownloadUrl('1');
      expect(actualUrl).toBe(expectedUrl);
    });
  });

  describe('triggerIngestion', () => {
    it('should trigger document ingestion', () => {
      const ingestionResponse = { message: 'Ingestion started successfully' };

      service.triggerIngestion('1').subscribe(response => {
        expect(response).toEqual(ingestionResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.documents}/1/ingest`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(ingestionResponse);
    });

    it('should handle ingestion trigger error', () => {
      service.triggerIngestion('999').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.documents}/999/ingest`);
      req.flush({ message: 'Document not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('utility methods', () => {
    describe('formatFileSize', () => {
      it('should format bytes correctly', () => {
        expect(service.formatFileSize(0)).toBe('0 Bytes');
        expect(service.formatFileSize(1024)).toBe('1 KB');
        expect(service.formatFileSize(1048576)).toBe('1 MB');
        expect(service.formatFileSize(1073741824)).toBe('1 GB');
        expect(service.formatFileSize(1536)).toBe('1.5 KB');
        expect(service.formatFileSize(2097152)).toBe('2 MB');
      });

      it('should handle decimal values', () => {
        expect(service.formatFileSize(1536)).toBe('1.5 KB');
        expect(service.formatFileSize(2560)).toBe('2.5 KB');
        expect(service.formatFileSize(1572864)).toBe('1.5 MB');
      });
    });

    describe('getFileIcon', () => {
      it('should return correct icons for different file types', () => {
        expect(service.getFileIcon('application/pdf')).toBe('picture_as_pdf');
        expect(service.getFileIcon('application/msword')).toBe('description');
        expect(service.getFileIcon('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe('description');
        expect(service.getFileIcon('text/plain')).toBe('article');
        expect(service.getFileIcon('image/jpeg')).toBe('image');
        expect(service.getFileIcon('image/png')).toBe('image');
        expect(service.getFileIcon('application/unknown')).toBe('insert_drive_file');
      });
    });

    describe('isValidFileType', () => {
      it('should validate allowed file types', () => {
        const pdfFile = new File([''], 'test.pdf', { type: 'application/pdf' });
        const docFile = new File([''], 'test.doc', { type: 'application/msword' });
        const docxFile = new File([''], 'test.docx', { 
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        });
        const txtFile = new File([''], 'test.txt', { type: 'text/plain' });

        expect(service.isValidFileType(pdfFile)).toBe(true);
        expect(service.isValidFileType(docFile)).toBe(true);
        expect(service.isValidFileType(docxFile)).toBe(true);
        expect(service.isValidFileType(txtFile)).toBe(true);
      });

      it('should reject invalid file types', () => {
        const imageFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
        const videoFile = new File([''], 'test.mp4', { type: 'video/mp4' });
        const unknownFile = new File([''], 'test.xyz', { type: 'application/unknown' });

        expect(service.isValidFileType(imageFile)).toBe(false);
        expect(service.isValidFileType(videoFile)).toBe(false);
        expect(service.isValidFileType(unknownFile)).toBe(false);
      });
    });
  });

  describe('error handling', () => {
    it('should handle network errors', () => {
      spyOn(console, 'error');

      service.getDocuments().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeDefined();
          expect(console.error).toHaveBeenCalledWith('Document service error:', error);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.documents}`);
      req.error(new ErrorEvent('Network error'));
    });

    it('should handle server errors', () => {
      spyOn(console, 'error');

      service.getDocument('1').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(console.error).toHaveBeenCalledWith('Document service error:', error);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.apiEndpoints.documents}/1`);
      req.flush({ message: 'Internal Server Error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });
});