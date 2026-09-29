export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface StructuredInsights {
  summary: string;
  classification: {
    category: string;
    primaryTopic: string;
    confidentialityLevel: 'Public' | 'Internal' | 'Confidential' | 'Restricted';
    sentiment: 'Positive' | 'Neutral' | 'Negative' | 'Urgent';
  };
  keyEntities: Array<{
    name: string;
    type: 'Organization' | 'Person' | 'Date' | 'Financial' | 'Metric' | 'Other';
    context?: string;
  }>;
  actionItems: Array<{
    task: string;
    priority: 'High' | 'Medium' | 'Low';
    assignee?: string;
  }>;
  confidenceScore: number;
  language: string;
}

export interface Document {
  id: string;
  userId: string;
  title: string;
  rawContent: string;
  sanitizedContent: string;
  characterCount: number;
  estimatedTokens: number;
  structuredInsights?: StructuredInsights;
  chunksCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Citation {
  chunkId: string;
  chunkIndex: number;
  snippet: string;
  similarityScore: number;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
  promptVersion?: string;
  model?: string;
  tokensUsed?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs?: number;
  confidenceScore?: number;
  feedback?: 'thumbs_up' | 'thumbs_down';
  feedbackComment?: string;
  createdAt: string;
  isStreaming?: boolean;
}

export interface LLMProviderInfo {
  id: string;
  name: string;
  configured: boolean;
}

export interface PromptVersionInfo {
  version: string;
  name: string;
  description: string;
  recommended: boolean;
}
