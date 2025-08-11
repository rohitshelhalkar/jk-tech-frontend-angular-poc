export interface QARequest {
  question: string;
  documentIds?: string[]; // Optional: specific documents to query
}

export interface DocumentExcerpt {
  documentId: string;
  documentTitle: string;
  content: string;
  relevanceScore: number;
  pageNumber?: number;
}

export interface QAResponse {
  answer: string;
  sources: DocumentExcerpt[];
  confidence: number;
  processingTime: number;
}

export interface QAHistory {
  id: string;
  question: string;
  answer: string;
  sources: DocumentExcerpt[];
  userId: string;
  createdAt: string;
}

export interface QAHistoryResponse {
  history: QAHistory[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}