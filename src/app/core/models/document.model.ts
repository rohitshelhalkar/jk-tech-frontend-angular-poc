export enum DocumentStatus {
  UPLOADED = 'UPLOADED',
  PROCESSING = 'PROCESSING', 
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED'
}



export interface Document {
  id: string;
  filename: string;
  fileName?: string; // alias for consistency
  originalName: string;
  mimetype: string;
  mimeType?: string; // alias for consistency  
  size: number;
  fileSize?: number; // alias for consistency
  filePath: string;
  title: string;
  description?: string;
  status?: DocumentStatus;
  uploadedBy: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface DocumentListResponse {
  documents: Document[];
  pagination: Pagination;
}

export interface CreateDocumentRequest {
  file: File;
  title?: string;
  description?: string;
}

export interface UpdateDocumentRequest {
  title?: string;
  description?: string;
}

export interface DocumentsResponse {
  documents: Document[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}