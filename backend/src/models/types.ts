import { z } from 'zod';

// ==========================================
// 1. User & Authentication Types
// ==========================================
export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
}

// ==========================================
// 2. Structured Insights Schema (Zod & TS)
// ==========================================
export const StructuredInsightsSchema = z.object({
  summary: z.string().describe("A concise 2-3 sentence executive summary of the content"),
  classification: z.object({
    category: z.string().describe("E.g. Technical, Legal, Financial, Research, Memo, General"),
    primaryTopic: z.string().describe("The primary subject matter"),
    confidentialityLevel: z.enum(['Public', 'Internal', 'Confidential', 'Restricted']),
    sentiment: z.enum(['Positive', 'Neutral', 'Negative', 'Urgent']),
  }),
  keyEntities: z.array(z.object({
    name: z.string(),
    type: z.enum(['Organization', 'Person', 'Date', 'Financial', 'Metric', 'Other']),
    context: z.string().optional(),
  })).describe("Key extracted named entities with contextual significance"),
  actionItems: z.array(z.object({
    task: z.string(),
    priority: z.enum(['High', 'Medium', 'Low']),
    assignee: z.string().optional(),
  })).describe("Actionable next steps identified in the document"),
  confidenceScore: z.number().min(0).max(1).describe("Model confidence score between 0.0 and 1.0"),
  language: z.string().default("English"),
});

export type StructuredInsights = z.infer<typeof StructuredInsightsSchema>;

// ==========================================
// 3. Document & Chunk Types (RAG)
// ==========================================
export interface DocumentChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  text: string;
  embedding: number[];
  tokenCount: number;
  startChar: number;
  endChar: number;
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

// ==========================================
// 4. Chat & Citation Types
// ==========================================
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
}

export interface ChatSession {
  id: string;
  documentId: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 5. LLM Engine & Provider Interfaces
// ==========================================
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMGenerationOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface LLMResponse {
  content: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
  finishReason?: string;
}

export interface LLMProvider {
  name: string;
  generateText(messages: LLMMessage[], options?: LLMGenerationOptions): Promise<LLMResponse>;
  streamText(
    messages: LLMMessage[], 
    onToken: (token: string) => void, 
    options?: LLMGenerationOptions
  ): Promise<LLMResponse>;
}

// ==========================================
// 6. Audit & Safety Types
// ==========================================
export interface AuditLog {
  id: string;
  timestamp: string;
  userId?: string;
  action: string;
  promptVersion?: string;
  model?: string;
  tokensUsed?: number;
  latencyMs?: number;
  ipAddress?: string;
  piiRedacted: boolean;
  metadata?: Record<string, any>;
}
