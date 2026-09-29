import fs from 'fs';
import path from 'path';
import { config } from '../config/env';
import { User, Document, DocumentChunk, ChatSession, ChatMessage, AuditLog } from '../models/types';

interface DatabaseSchema {
  users: Record<string, User>;
  documents: Record<string, Document>;
  chunks: Record<string, DocumentChunk>;
  sessions: Record<string, ChatSession>;
  messages: Record<string, ChatMessage>;
  auditLogs: AuditLog[];
}

const initialDb: DatabaseSchema = {
  users: {},
  documents: {},
  chunks: {},
  sessions: {},
  messages: {},
  auditLogs: [],
};

class Database {
  private dbPath: string;
  private data: DatabaseSchema;
  private writeTimer: NodeJS.Timeout | null = null;

  constructor() {
    const dir = config.dataPath;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.dbPath = path.join(dir, 'docintel.json');
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Failed to load database file, initializing fresh store:', err);
    }
    return { ...initialDb };
  }

  public persistSync(): void {
    try {
      const tempPath = `${this.dbPath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.dbPath);
    } catch (err) {
      console.error('Error persisting database:', err);
    }
  }

  private schedulePersist(): void {
    if (this.writeTimer) return;
    this.writeTimer = setTimeout(() => {
      this.persistSync();
      this.writeTimer = null;
    }, 100);
  }

  // --- Users ---
  public findUserByEmail(email: string): User | undefined {
    return Object.values(this.data.users).find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string): User | undefined {
    return this.data.users[id];
  }

  public saveUser(user: User): User {
    this.data.users[user.id] = user;
    this.schedulePersist();
    return user;
  }

  // --- Documents ---
  public findDocumentById(id: string): Document | undefined {
    return this.data.documents[id];
  }

  public findDocumentsByUserId(userId: string): Document[] {
    return Object.values(this.data.documents)
      .filter(d => d.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public saveDocument(doc: Document): Document {
    this.data.documents[doc.id] = doc;
    this.schedulePersist();
    return doc;
  }

  public deleteDocument(id: string): boolean {
    if (this.data.documents[id]) {
      delete this.data.documents[id];
      // Also delete associated chunks
      for (const [chunkId, chunk] of Object.entries(this.data.chunks)) {
        if (chunk.documentId === id) {
          delete this.data.chunks[chunkId];
        }
      }
      this.schedulePersist();
      return true;
    }
    return false;
  }

  // --- Chunks (Vector Store backing) ---
  public saveChunks(chunks: DocumentChunk[]): void {
    for (const chunk of chunks) {
      this.data.chunks[chunk.id] = chunk;
    }
    this.schedulePersist();
  }

  public getChunksByDocumentId(documentId: string): DocumentChunk[] {
    return Object.values(this.data.chunks)
      .filter(c => c.documentId === documentId)
      .sort((a, b) => a.chunkIndex - b.chunkIndex);
  }

  // --- Chat Sessions & Messages ---
  public getOrCreateSession(documentId: string, userId: string): ChatSession {
    const existing = Object.values(this.data.sessions).find(
      s => s.documentId === documentId && s.userId === userId
    );
    if (existing) {
      // Hydrate with latest messages
      existing.messages = Object.values(this.data.messages)
        .filter(m => m.sessionId === existing.id)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      return existing;
    }

    const session: ChatSession = {
      id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      documentId,
      userId,
      title: 'Document Discussion',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.sessions[session.id] = session;
    this.schedulePersist();
    return session;
  }

  public getSessionById(sessionId: string): ChatSession | undefined {
    const session = this.data.sessions[sessionId];
    if (session) {
      session.messages = Object.values(this.data.messages)
        .filter(m => m.sessionId === sessionId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    return session;
  }

  public saveMessage(message: ChatMessage): ChatMessage {
    this.data.messages[message.id] = message;
    if (this.data.sessions[message.sessionId]) {
      this.data.sessions[message.sessionId].updatedAt = new Date().toISOString();
    }
    this.schedulePersist();
    return message;
  }

  public updateMessageFeedback(messageId: string, feedback: 'thumbs_up' | 'thumbs_down', comment?: string): boolean {
    const msg = this.data.messages[messageId];
    if (msg) {
      msg.feedback = feedback;
      if (comment) msg.feedbackComment = comment;
      this.schedulePersist();
      return true;
    }
    return false;
  }

  // --- Audit Logs ---
  public logAudit(entry: AuditLog): void {
    this.data.auditLogs.push(entry);
    // Keep last 5000 entries
    if (this.data.auditLogs.length > 5000) {
      this.data.auditLogs = this.data.auditLogs.slice(-5000);
    }
    this.schedulePersist();
  }

  public getRecentAuditLogs(limit = 100): AuditLog[] {
    return this.data.auditLogs.slice(-limit).reverse();
  }
}

export const db = new Database();
