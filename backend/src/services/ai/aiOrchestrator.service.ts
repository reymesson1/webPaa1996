import { v4 as uuidv4 } from 'uuid';
import { db } from '../../database/db';
import { StructuredInsights, Citation, LLMMessage } from '../../models/types';
import { PromptRegistry } from './prompts/promptRegistry';
import { ProviderFactory } from './providers/providerFactory';
import { ResponsePostProcessor } from './postProcessing.service';
import { RagService } from '../rag/rag.service';
import { rateLimiter } from '../../middleware/rateLimiter.middleware';

export interface AnswerResult {
  content: string;
  citations: Citation[];
  confidenceScore: number;
  isUncertain: boolean;
  uncertaintyReason?: string;
  tokensUsed: { promptTokens: number; completionTokens: number; totalTokens: number };
  latencyMs: number;
  promptVersion: string;
  model: string;
}

export class AIOrchestratorService {
  /**
   * Generates structured insights (summary, categories, entities, actions)
   * with complete separation of Prompting -> Invocation -> Post-Processing.
   */
  public static async extractDocumentInsights(
    title: string,
    content: string,
    promptVersion?: string,
    providerName?: string,
    userId?: string
  ): Promise<{ insights: StructuredInsights; tokensUsed: number; latencyMs: number }> {
    const startTime = Date.now();

    // 1. PROMPT CONSTRUCTION
    const template = PromptRegistry.getExtractionPrompt(promptVersion);
    const messages: LLMMessage[] = [
      { role: 'system', content: template.buildSystemInstruction() },
      { role: 'user', content: template.buildUserPrompt({ documentTitle: title, documentContent: content }) },
    ];

    // 2. MODEL INVOCATION
    const provider = ProviderFactory.getProvider(providerName);
    const rawResponse = await provider.generateText(messages, {
      temperature: template.temperature,
      maxTokens: template.maxTokens,
    });

    const latencyMs = Date.now() - startTime;

    // 3. RESPONSE POST-PROCESSING
    const insights = ResponsePostProcessor.parseAndValidateStructuredInsights(rawResponse.content);

    // Record token usage for cost limiting
    if (userId) {
      rateLimiter.recordTokenUsage(userId, rawResponse.totalTokens);
    }

    // Audit Logging
    db.logAudit({
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      userId,
      action: 'extract_document_insights',
      promptVersion: template.version,
      model: rawResponse.model,
      tokensUsed: rawResponse.totalTokens,
      latencyMs,
      piiRedacted: true,
    });

    return {
      insights,
      tokensUsed: rawResponse.totalTokens,
      latencyMs,
    };
  }

  /**
   * Synchronous Q&A over document with RAG grounding
   */
  public static async answerQuestion(
    documentId: string,
    documentTitle: string,
    question: string,
    promptVersion?: string,
    providerName?: string,
    history?: Array<{ role: 'user' | 'assistant'; content: string }>,
    userId?: string
  ): Promise<AnswerResult> {
    const startTime = Date.now();

    // 1. RETRIEVE RELEVANT CONTEXT (RAG)
    const retrieved = await RagService.retrieveRelevantContext(documentId, question, 3);

    // 2. PROMPT CONSTRUCTION
    const promptTemplate = PromptRegistry.getQAPrompt(promptVersion);
    const messages: LLMMessage[] = [
      { role: 'system', content: promptTemplate.buildSystemInstruction() },
      {
        role: 'user',
        content: promptTemplate.buildUserPrompt({
          documentTitle,
          contextString: retrieved.contextString,
          question,
          history,
        }),
      },
    ];

    // 3. MODEL INVOCATION
    const provider = ProviderFactory.getProvider(providerName);
    const rawResponse = await provider.generateText(messages, {
      temperature: promptTemplate.temperature,
      maxTokens: promptTemplate.maxTokens,
    });

    const latencyMs = Date.now() - startTime;

    // 4. RESPONSE POST-PROCESSING
    const processed = ResponsePostProcessor.processQAResponse(
      rawResponse.content,
      retrieved.citations,
      retrieved.topRelevanceScore
    );

    // Filter citations to include those cited or top match
    const activeCitations = retrieved.citations.filter(
      c => processed.citedChunks.includes(c.chunkIndex) || c.similarityScore > 0.4
    );

    if (userId) {
      rateLimiter.recordTokenUsage(userId, rawResponse.totalTokens);
    }

    // Audit Logging
    db.logAudit({
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      userId,
      action: 'answer_question_sync',
      promptVersion: promptTemplate.version,
      model: rawResponse.model,
      tokensUsed: rawResponse.totalTokens,
      latencyMs,
      piiRedacted: true,
    });

    return {
      content: processed.cleanContent,
      citations: activeCitations.length > 0 ? activeCitations : retrieved.citations.slice(0, 1),
      confidenceScore: processed.confidenceScore,
      isUncertain: processed.isUncertain,
      uncertaintyReason: processed.uncertaintyReason,
      tokensUsed: {
        promptTokens: rawResponse.promptTokens,
        completionTokens: rawResponse.completionTokens,
        totalTokens: rawResponse.totalTokens,
      },
      latencyMs,
      promptVersion: promptTemplate.version,
      model: rawResponse.model,
    };
  }

  /**
   * Streaming Q&A over document with token-by-token Server-Sent Events (SSE)
   */
  public static async streamAnswerQuestion(
    documentId: string,
    documentTitle: string,
    question: string,
    promptVersion: string | undefined,
    providerName: string | undefined,
    history: Array<{ role: 'user' | 'assistant'; content: string }> | undefined,
    onToken: (token: string) => void,
    userId?: string
  ): Promise<AnswerResult> {
    const startTime = Date.now();

    // 1. RAG CONTEXT RETRIEVAL
    const retrieved = await RagService.retrieveRelevantContext(documentId, question, 3);

    // 2. PROMPT CONSTRUCTION
    const promptTemplate = PromptRegistry.getQAPrompt(promptVersion);
    const messages: LLMMessage[] = [
      { role: 'system', content: promptTemplate.buildSystemInstruction() },
      {
        role: 'user',
        content: promptTemplate.buildUserPrompt({
          documentTitle,
          contextString: retrieved.contextString,
          question,
          history,
        }),
      },
    ];

    // 3. MODEL INVOCATION WITH STREAMING
    const provider = ProviderFactory.getProvider(providerName);
    let streamedTokens = '';

    const rawResponse = await provider.streamText(
      messages,
      (token) => {
        streamedTokens += token;
        onToken(token);
      },
      {
        temperature: promptTemplate.temperature,
        maxTokens: promptTemplate.maxTokens,
      }
    );

    const latencyMs = Date.now() - startTime;

    // 4. RESPONSE POST-PROCESSING
    const processed = ResponsePostProcessor.processQAResponse(
      streamedTokens || rawResponse.content,
      retrieved.citations,
      retrieved.topRelevanceScore
    );

    const activeCitations = retrieved.citations.filter(
      c => processed.citedChunks.includes(c.chunkIndex) || c.similarityScore > 0.4
    );

    if (userId) {
      rateLimiter.recordTokenUsage(userId, rawResponse.totalTokens);
    }

    db.logAudit({
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      userId,
      action: 'answer_question_stream',
      promptVersion: promptTemplate.version,
      model: rawResponse.model,
      tokensUsed: rawResponse.totalTokens,
      latencyMs,
      piiRedacted: true,
    });

    return {
      content: processed.cleanContent,
      citations: activeCitations.length > 0 ? activeCitations : retrieved.citations.slice(0, 1),
      confidenceScore: processed.confidenceScore,
      isUncertain: processed.isUncertain,
      uncertaintyReason: processed.uncertaintyReason,
      tokensUsed: {
        promptTokens: rawResponse.promptTokens,
        completionTokens: rawResponse.completionTokens,
        totalTokens: rawResponse.totalTokens,
      },
      latencyMs,
      promptVersion: promptTemplate.version,
      model: rawResponse.model,
    };
  }
}
