export enum IngestionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface IngestionJob {
  id: string;
  documentId: string;
  userId: string;
  status: IngestionStatus;
  documentName: string; // alias for easy access
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  document: {
    id: string;
    filename: string;
    originalName: string;
    title: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface TriggerIngestionRequest {
  documentId: string;
}

export interface IngestionJobsResponse {
  jobs: IngestionJob[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface IngestionJobsQuery {
  page?: number;
  limit?: number;
  status?: IngestionStatus;
}