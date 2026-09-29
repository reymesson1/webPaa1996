import { describe, it, expect } from 'vitest';
import { RecursiveTextChunker } from '../services/rag/chunker';
import { DenseEmbeddingGenerator, InMemoryVectorStore } from '../services/rag/vectorStore';
import { DocumentChunk } from '../models/types';

describe('RAG Pipeline Components', () => {
  it('should split long text into overlapping chunks respecting sentence boundaries', () => {
    const chunker = new RecursiveTextChunker(100, 20);
    const text =
      'First sentence introduces system architecture. ' +
      'Second sentence explains database design and indexes. ' +
      'Third sentence elaborates on model invocation pipelines. ' +
      'Fourth sentence covers end-to-end evaluation metrics.';

    const chunks = chunker.chunk(text);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].index).toBe(0);
    expect(chunks[0].text.length).toBeLessThanOrEqual(120);
  });

  it('should generate normalized dense embedding vectors', () => {
    const v1 = DenseEmbeddingGenerator.generateVector('cloud computing serverless microservices');
    expect(v1.length).toBe(128);

    // Compute magnitude (should be normalized close to 1.0)
    let mag = 0;
    for (const val of v1) mag += val * val;
    expect(Math.sqrt(mag)).toBeCloseTo(1.0, 2);
  });

  it('should calculate higher cosine similarity for semantically related text', () => {
    const vBase = DenseEmbeddingGenerator.generateVector('kubernetes docker containers microservice deployment');
    const vRelated = DenseEmbeddingGenerator.generateVector('deploying containerized application with docker and pods');
    const vUnrelated = DenseEmbeddingGenerator.generateVector('baking chocolate chip cookies with organic butter');

    const simRelated = DenseEmbeddingGenerator.cosineSimilarity(vBase, vRelated);
    const simUnrelated = DenseEmbeddingGenerator.cosineSimilarity(vBase, vUnrelated);

    expect(simRelated).toBeGreaterThan(simUnrelated);
  });

  it('should store and retrieve top-k chunks from vector store', async () => {
    const store = new InMemoryVectorStore();
    const docId = 'doc_test_1';

    const chunk1: DocumentChunk = {
      id: 'chk_1',
      documentId: docId,
      chunkIndex: 1,
      text: 'PostgreSQL provides robust relational guarantees and ACID transactions.',
      embedding: DenseEmbeddingGenerator.generateVector('PostgreSQL relational database ACID transactions'),
      tokenCount: 15,
      startChar: 0,
      endChar: 70,
    };

    const chunk2: DocumentChunk = {
      id: 'chk_2',
      documentId: docId,
      chunkIndex: 2,
      text: 'The weather forecast predicts sunny skies with a light afternoon breeze.',
      embedding: DenseEmbeddingGenerator.generateVector('weather forecast sunny skies breeze'),
      tokenCount: 15,
      startChar: 71,
      endChar: 140,
    };

    await store.upsertChunks([chunk1, chunk2]);

    const queryVec = DenseEmbeddingGenerator.generateVector('database transaction ACID');
    const results = await store.search(docId, queryVec, 1, 0.05);

    expect(results.length).toBe(1);
    expect(results[0].chunk.id).toBe('chk_1');
    expect(results[0].score).toBeGreaterThan(0.2);
  });
});
