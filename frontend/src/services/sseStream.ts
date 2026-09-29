import { Citation, ChatMessage } from '../types';

export interface StreamCallbacks {
  onStatus?: (status: string, message: string) => void;
  onToken?: (token: string) => void;
  onDone?: (data: {
    message: ChatMessage;
    citations: Citation[];
    confidenceScore: number;
    isUncertain: boolean;
    uncertaintyReason?: string;
    tokensUsed: any;
    latencyMs: number;
  }) => void;
  onError?: (error: string) => void;
}

export class SSEStreamClient {
  public static async streamChat(
    payload: {
      documentId: string;
      question: string;
      promptVersion?: string;
      provider?: string;
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
    },
    callbacks: StreamCallbacks,
    abortSignal?: AbortSignal
  ): Promise<void> {
    const token = localStorage.getItem('docintel_token');

    try {
      const response = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
        signal: abortSignal,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP error ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported by this browser.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          if (!block.trim()) continue;

          let eventType = 'message';
          let dataStr = '';

          const eventMatch = block.match(/^event:\s*(\w+)/m);
          if (eventMatch) {
            eventType = eventMatch[1];
          }

          const dataMatch = block.match(/^data:\s*(.+)$/m);
          if (dataMatch) {
            dataStr = dataMatch[1];
          }

          if (!dataStr) continue;

          try {
            const parsed = JSON.parse(dataStr);

            if (eventType === 'status') {
              callbacks.onStatus?.(parsed.status, parsed.message);
            } else if (eventType === 'token') {
              callbacks.onToken?.(parsed.token);
            } else if (eventType === 'done') {
              callbacks.onDone?.(parsed);
            } else if (eventType === 'error') {
              callbacks.onError?.(parsed.error || 'Unknown error');
            }
          } catch (e) {
            console.warn('[SSE_PARSE_ERROR]', e, block);
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('[SSE] Stream aborted by user.');
        return;
      }
      callbacks.onError?.(err.message || 'Streaming failed');
    }
  }
}
