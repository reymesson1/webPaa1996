import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'docintel-super-secret-production-jwt-key-2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // AI Provider Configuration
  llmProvider: (process.env.LLM_PROVIDER || 'mock').toLowerCase() as 'mock' | 'gemini' | 'openai',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  
  // Prompt configuration
  defaultPromptVersion: process.env.DEFAULT_PROMPT_VERSION || 'v2',
  
  // Rate limiting & Safety
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '60', 10),
  maxDocumentLengthChars: parseInt(process.env.MAX_DOCUMENT_LENGTH_CHARS || '50000', 10),
  enablePiiRedaction: process.env.ENABLE_PII_REDACTION !== 'false',
  
  // Storage & Persistence
  dataPath: process.env.DATA_PATH || path.join(process.cwd(), '.data'),
};
