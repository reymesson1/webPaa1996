import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AIOrchestratorService } from '../services/ai/aiOrchestrator.service';
import { DocumentService } from '../services/document.service';
import { ProviderFactory } from '../services/ai/providers/providerFactory';
import { PromptRegistry } from '../services/ai/prompts/promptRegistry';
import { db } from '../database/db';
import { ChatMessage } from '../models/types';

export class AIController {
  /**
   * Synchronous Chat / QA Endpoint
   */
  public static async chatSync(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user!;
      const { documentId, question, promptVersion, provider, history } = req.body;
      const sanitizedQuestion = req.body.sanitizedQuestion || question;

      if (!documentId || !question) {
        return res.status(400).json({ error: 'documentId and question are required.' });
      }

      const doc = DocumentService.getDocumentById(documentId, user.id);
      if (!doc) {
        return res.status(404).json({ error: 'Document not found' });
      }

      const session = db.getOrCreateSession(documentId, user.id);

      // Save user message
      const userMsg: ChatMessage = {
        id: `msg_${uuidv4().substring(0, 8)}`,
        sessionId: session.id,
        role: 'user',
        content: question,
        createdAt: new Date().toISOString(),
      };
      db.saveMessage(userMsg);

      // Orchestrate AI answering
      const result = await AIOrchestratorService.answerQuestion(
        documentId,
        doc.title,
        sanitizedQuestion,
        promptVersion,
        provider,
        history,
        user.id
      );

      // Save assistant message
      const assistantMsg: ChatMessage = {
        id: `msg_${uuidv4().substring(0, 8)}`,
        sessionId: session.id,
        role: 'assistant',
        content: result.content,
        citations: result.citations,
        promptVersion: result.promptVersion,
        model: result.model,
        tokensUsed: result.tokensUsed,
        latencyMs: result.latencyMs,
        confidenceScore: result.confidenceScore,
        createdAt: new Date().toISOString(),
      };
      db.saveMessage(assistantMsg);

      return res.json({
        message: assistantMsg,
        session: db.getSessionById(session.id),
        guardrailSummary: (req as any).queryGuardrailResult,
      });
    } catch (err: any) {
      console.error('[AI_CONTROLLER] Sync chat error:', err);
      return res.status(500).json({ error: err.message || 'Failed to process AI query' });
    }
  }

  /**
   * Streaming Server-Sent Events (SSE) Endpoint
   */
  public static async chatStream(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user!;
      const { documentId, question, promptVersion, provider, history } = req.body;
      const sanitizedQuestion = req.body.sanitizedQuestion || question;

      if (!documentId || !question) {
        return res.status(400).json({ error: 'documentId and question are required.' });
      }

      const doc = DocumentService.getDocumentById(documentId, user.id);
      if (!doc) {
        return res.status(404).json({ error: 'Document not found' });
      }

      const session = db.getOrCreateSession(documentId, user.id);

      // Record User Message
      const userMsg: ChatMessage = {
        id: `msg_${uuidv4().substring(0, 8)}`,
        sessionId: session.id,
        role: 'user',
        content: question,
        createdAt: new Date().toISOString(),
      };
      db.saveMessage(userMsg);

      // Prepare SSE Headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      // Helper to send formatted SSE message
      const sendEvent = (event: string, data: any) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      };

      // 1. Initial Status
      sendEvent('status', { status: 'retrieving_chunks', message: 'Retrieving grounded context...' });

      // 2. Stream tokens via Orchestrator
      const result = await AIOrchestratorService.streamAnswerQuestion(
        documentId,
        doc.title,
        sanitizedQuestion,
        promptVersion,
        provider,
        history,
        (token) => {
          sendEvent('token', { token });
        },
        user.id
      );

      // 3. Save Assistant Message
      const assistantMsg: ChatMessage = {
        id: `msg_${uuidv4().substring(0, 8)}`,
        sessionId: session.id,
        role: 'assistant',
        content: result.content,
        citations: result.citations,
        promptVersion: result.promptVersion,
        model: result.model,
        tokensUsed: result.tokensUsed,
        latencyMs: result.latencyMs,
        confidenceScore: result.confidenceScore,
        createdAt: new Date().toISOString(),
      };
      db.saveMessage(assistantMsg);

      // 4. Send Completion event with full metadata
      sendEvent('done', {
        message: assistantMsg,
        citations: result.citations,
        confidenceScore: result.confidenceScore,
        isUncertain: result.isUncertain,
        uncertaintyReason: result.uncertaintyReason,
        tokensUsed: result.tokensUsed,
        latencyMs: result.latencyMs,
      });

      res.end();
    } catch (err: any) {
      console.error('[AI_CONTROLLER] Streaming error:', err);
      if (!res.headersSent) {
        return res.status(500).json({ error: err.message || 'Stream processing failed' });
      }
      res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }

  /**
   * Record Human-in-the-Loop Feedback (Thumbs Up / Down) for Quality Evaluation
   */
  public static feedback(req: AuthenticatedRequest, res: Response) {
    try {
      const { messageId, feedback, comment } = req.body;
      if (!messageId || !['thumbs_up', 'thumbs_down'].includes(feedback)) {
        return res.status(400).json({ error: 'messageId and valid feedback (thumbs_up | thumbs_down) required.' });
      }

      const updated = db.updateMessageFeedback(messageId, feedback, comment);
      if (!updated) {
        return res.status(404).json({ error: 'Message not found' });
      }

      return res.json({ success: true, message: 'Feedback recorded for model evaluation.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to submit feedback' });
    }
  }

  /**
   * Retrieve Session with full chat history
   */
  public static getSession(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user!;
      const { documentId } = req.params;
      const session = db.getOrCreateSession(documentId, user.id);
      return res.json({ session });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to get chat session' });
    }
  }

  /**
   * List available LLM Providers
   */
  public static getProviders(_req: AuthenticatedRequest, res: Response) {
    return res.json({
      providers: ProviderFactory.getAvailableProviders(),
    });
  }

  /**
   * List available Prompt Versions
   */
  public static getPrompts(_req: AuthenticatedRequest, res: Response) {
    return res.json({
      prompts: PromptRegistry.listAvailableVersions(),
    });
  }
}
