import { v4 as uuidv4 } from 'uuid';
import { db } from '../../database/db';
import { Document, DocumentChunk, Citation } from '../../models/types';
import { RecursiveTextChunker } from './chunker';
import { DenseEmbeddingGenerator, vectorStore } from './vectorStore';

export interface RetrievedContext {
  contextString: string;
  citations: Citation[];
  topRelevanceScore: number;
}

export class RagService {
  private static chunker = new RecursiveTextChunker(600, 80);

  /**
   * Chunks a document, generates dense embedding vectors,
   * stores chunks in DB and indexes them in the Vector Store.
   */
  public static async processAndIndexDocument(document: Document): Promise<DocumentChunk[]> {
    const rawChunks = this.chunker.chunk(document.sanitizedContent);
    const documentChunks: DocumentChunk[] = [];

    for (const raw of rawChunks) {
      const embedding = DenseEmbeddingGenerator.generateVector(raw.text);
      const chunk: DocumentChunk = {
        id: `chk_${uuidv4().substring(0, 8)}`,
        documentId: document.id,
        chunkIndex: raw.index + 1,
        text: raw.text,
        embedding,
        tokenCount: raw.estimatedTokens,
        startChar: raw.startChar,
        endChar: raw.endChar,
      };
      documentChunks.push(chunk);
    }

    // Persist to relational / JSON database
    db.saveChunks(documentChunks);

    // Index into vector store
    await vectorStore.upsertChunks(documentChunks);

    return documentChunks;
  }

  /**
   * Retrieves relevant document chunks for a user question using
   * Cosine Similarity Vector Search over the document's vector index.
   */
  public static async retrieveRelevantContext(
    documentId: string, 
    query: string, 
    topK: number = 3
  ): Promise<RetrievedContext> {
    // Generate embedding for query
    const queryVector = DenseEmbeddingGenerator.generateVector(query);

    // Search vector store
    let results = await vectorStore.search(documentId, queryVector, topK, 0.05);

    // Fallback if in-memory index was restarted: reload from DB
    if (results.length === 0) {
      const dbChunks = db.getChunksByDocumentId(documentId);
      if (dbChunks.length > 0) {
        await vectorStore.upsertChunks(dbChunks);
        results = await vectorStore.search(documentId, queryVector, topK, 0.05);
      }
    }

    // If still empty (e.g. extremely short doc), load first chunk as fallback
    if (results.length === 0) {
      const allChunks = db.getChunksByDocumentId(documentId);
      if (allChunks.length > 0) {
        results = [{ chunk: allChunks[0], score: 0.5 }];
      }
    }

    const citations: Citation[] = [];
    let contextParts: string[] = [];
    let topScore = 0;

    for (const item of results) {
      if (item.score > topScore) topScore = item.score;

      const snippet = item.chunk.text.length > 150 
        ? item.chunk.text.substring(0, 150) + '...'
        : item.chunk.text;

      citations.push({
        chunkId: item.chunk.id,
        chunkIndex: item.chunk.chunkIndex,
        snippet,
        similarityScore: Math.round(item.score * 100) / 100,
      });

      contextParts.push(`[Source Chunk ${item.chunk.chunkIndex}]:\n${item.chunk.text}`);
    }

    const contextString = contextParts.join('\n\n---\n\n');

    return {
      contextString,
      citations,
      topRelevanceScore: topScore,
    };
  }
}
