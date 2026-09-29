import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { Document } from '../models/types';
import { RagService } from './rag/rag.service';
import { AIOrchestratorService } from './ai/aiOrchestrator.service';

export class DocumentService {
  public static async createDocument(
    userId: string,
    title: string,
    rawContent: string,
    sanitizedContent: string,
    promptVersion?: string,
    providerName?: string
  ): Promise<Document> {
    const docId = `doc_${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();

    const document: Document = {
      id: docId,
      userId,
      title: title.trim() || 'Untitled Document',
      rawContent,
      sanitizedContent,
      characterCount: sanitizedContent.length,
      estimatedTokens: Math.ceil(sanitizedContent.length / 4),
      chunksCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    // Save initial document record
    db.saveDocument(document);

    // Chunk and index for RAG
    const chunks = await RagService.processAndIndexDocument(document);
    document.chunksCount = chunks.length;

    // Automatically trigger structured data extraction
    try {
      const { insights } = await AIOrchestratorService.extractDocumentInsights(
        document.title,
        document.sanitizedContent,
        promptVersion,
        providerName,
        userId
      );
      document.structuredInsights = insights;
    } catch (err) {
      console.warn('[DOCUMENT_SERVICE] Automated extraction warning:', err);
    }

    // Persist final state
    db.saveDocument(document);
    return document;
  }

  public static getDocuments(userId: string): Document[] {
    return db.findDocumentsByUserId(userId);
  }

  public static getDocumentById(id: string, userId: string): Document | undefined {
    const doc = db.findDocumentById(id);
    if (!doc || doc.userId !== userId) return undefined;
    return doc;
  }

  public static deleteDocument(id: string, userId: string): boolean {
    const doc = db.findDocumentById(id);
    if (!doc || doc.userId !== userId) return false;
    return db.deleteDocument(id);
  }

  public static async reextractInsights(
    id: string,
    userId: string,
    promptVersion?: string,
    providerName?: string
  ): Promise<Document> {
    const doc = this.getDocumentById(id, userId);
    if (!doc) throw new Error('Document not found');

    const { insights } = await AIOrchestratorService.extractDocumentInsights(
      doc.title,
      doc.sanitizedContent,
      promptVersion,
      providerName,
      userId
    );

    doc.structuredInsights = insights;
    doc.updatedAt = new Date().toISOString();
    db.saveDocument(doc);
    return doc;
  }
}
