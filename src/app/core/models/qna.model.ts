export interface Message {
  id: string;
  conversationId: string;
  userId: string;
  content: string;
  role: 'user' | 'assistant';
  metadata?: {
    sources?: Array<{
      documentId: string;
      chunkId: string;
      content: string;
    }>;
    tokensUsed?: number;
    model?: string;
    processingTime?: number;
    error?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  title?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
}

export interface ConversationResponse {
  conversations: Conversation[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateConversationRequest {
  title?: string;
}

export interface SendMessageRequest {
  content: string;
  conversationId: string;
  documentIds?: string[];
}

export interface SendMessageResponse {
  userMessage: Message;
  assistantMessage: Message;
}

export interface ConversationsQuery {
  limit?: number;
  offset?: number;
  search?: string;
}