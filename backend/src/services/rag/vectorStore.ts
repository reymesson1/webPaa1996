import { DocumentChunk } from '../../models/types';

export interface ScoredChunk {
  chunk: DocumentChunk;
  score: number;
}

export interface IVectorStore {
  upsertChunks(chunks: DocumentChunk[]): Promise<void>;
  search(documentId: string, queryVector: number[], topK: number, minScore?: number): Promise<ScoredChunk[]>;
  deleteByDocumentId(documentId: string): Promise<void>;
}

export class DenseEmbeddingGenerator {
  private static readonly DIMENSIONS = 128;

  /**
   * Generates a 128-dimensional dense normalized embedding vector
   * from input text using sub-word hash projection and frequency weighting.
   * This provides fast, offline, deterministic cosine-similarity search
   * across documents without requiring paid third-party embedding calls.
   */
  public static generateVector(text: string): number[] {
    const vector = new Array(this.DIMENSIONS).fill(0);
    const tokens = text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1);

    if (tokens.length === 0) return vector;

    // Term frequency hashing
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      // Generate multiple hash buckets for n-grams
      for (let j = 0; j < token.length; j++) {
        const hash = this.stringHash(token.substring(j, j + 3));
        const index = Math.abs(hash) % this.DIMENSIONS;
        vector[index] += 1.0 / Math.sqrt(tokens.length);
      }
    }

    // L2 Normalize the vector so cosine similarity is simply the dot product
    let norm = 0;
    for (let i = 0; i < this.DIMENSIONS; i++) {
      norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm);

    if (norm > 0) {
      for (let i = 0; i < this.DIMENSIONS; i++) {
        vector[i] /= norm;
      }
    }

    return vector;
  }

  private static stringHash(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }

  /**
   * Computes Cosine Similarity between two normalized vectors
   */
  public static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    let dot = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
    }
    return Math.max(0, Math.min(1, dot));
  }
}

/**
 * In-Memory Vector Store implementation with cosine similarity search.
 * Production systems can swap this for pgvector, Pinecone, or OpenSearch.
 */
export class InMemoryVectorStore implements IVectorStore {
  private chunksByDoc = new Map<string, DocumentChunk[]>();

  public async upsertChunks(chunks: DocumentChunk[]): Promise<void> {
    for (const chunk of chunks) {
      const list = this.chunksByDoc.get(chunk.documentId) || [];
      const existingIdx = list.findIndex(c => c.id === chunk.id);
      if (existingIdx >= 0) {
        list[existingIdx] = chunk;
      } else {
        list.push(chunk);
      }
      this.chunksByDoc.set(chunk.documentId, list);
    }
  }

  public async search(
    documentId: string, 
    queryVector: number[], 
    topK: number = 3, 
    minScore: number = 0.15
  ): Promise<ScoredChunk[]> {
    const list = this.chunksByDoc.get(documentId) || [];
    if (list.length === 0) return [];

    const scored: ScoredChunk[] = list.map(chunk => ({
      chunk,
      score: DenseEmbeddingGenerator.cosineSimilarity(queryVector, chunk.embedding),
    }));

    return scored
      .filter(item => item.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  public async deleteByDocumentId(documentId: string): Promise<void> {
    this.chunksByDoc.delete(documentId);
  }
}

export const vectorStore = new InMemoryVectorStore();
