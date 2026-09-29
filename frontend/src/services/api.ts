import { Document, LLMProviderInfo, PromptVersionInfo, ChatMessage } from '../types';

const API_BASE = '/api';

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('docintel_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `HTTP error ${response.status}`);
    }

    return data as T;
  }

  // Auth
  public async login(email: string, password: string) {
    return this.request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  public async register(email: string, password: string, name: string) {
    return this.request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  public async demoLogin() {
    return this.request<{ user: any; token: string }>('/auth/demo', {
      method: 'POST',
    });
  }

  public async getMe() {
    return this.request<{ user: any }>('/auth/me');
  }

  // Documents
  public async listDocuments() {
    return this.request<{ documents: Document[] }>('/documents');
  }

  public async getDocument(id: string) {
    return this.request<{ document: Document }>(`/documents/${id}`);
  }

  public async createDocument(title: string, content: string, promptVersion?: string, provider?: string) {
    return this.request<{ document: Document; guardrailSummary?: any }>('/documents', {
      method: 'POST',
      body: JSON.stringify({ title, content, promptVersion, provider }),
    });
  }

  public async deleteDocument(id: string) {
    return this.request<{ success: boolean }>(`/documents/${id}`, {
      method: 'DELETE',
    });
  }

  public async reextractInsights(id: string, promptVersion?: string, provider?: string) {
    return this.request<{ document: Document }>(`/documents/${id}/reextract`, {
      method: 'POST',
      body: JSON.stringify({ promptVersion, provider }),
    });
  }

  // AI & Chat
  public async getSession(documentId: string) {
    return this.request<{ session: { id: string; messages: ChatMessage[] } }>(`/ai/session/${documentId}`);
  }

  public async sendChatSync(
    documentId: string,
    question: string,
    promptVersion?: string,
    provider?: string,
    history?: Array<{ role: 'user' | 'assistant'; content: string }>
  ) {
    return this.request<{ message: ChatMessage; session: any; guardrailSummary?: any }>('/ai/chat/sync', {
      method: 'POST',
      body: JSON.stringify({ documentId, question, promptVersion, provider, history }),
    });
  }

  public async submitFeedback(messageId: string, feedback: 'thumbs_up' | 'thumbs_down', comment?: string) {
    return this.request<{ success: boolean }>('/ai/feedback', {
      method: 'POST',
      body: JSON.stringify({ messageId, feedback, comment }),
    });
  }

  public async getProviders() {
    return this.request<{ providers: LLMProviderInfo[] }>('/ai/providers');
  }

  public async getPrompts() {
    return this.request<{ prompts: PromptVersionInfo[] }>('/ai/prompts');
  }
}

export const api = new ApiService();
