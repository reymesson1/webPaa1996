import { LLMProvider } from './llmProvider.interface';
import { GeminiProvider } from './gemini.provider';
import { OpenAIProvider } from './openai.provider';
import { MockProvider } from './mock.provider';
import { config } from '../../../config/env';

export class ProviderFactory {
  private static mockInstance = new MockProvider();
  private static geminiInstance: GeminiProvider | null = null;
  private static openaiInstance: OpenAIProvider | null = null;

  public static getProvider(providerName?: string): LLMProvider {
    const selected = (providerName || config.llmProvider).toLowerCase();

    if (selected === 'gemini') {
      if (!config.geminiApiKey) {
        console.warn('[PROVIDER_FALLBACK] GEMINI_API_KEY is not set. Falling back to MockProvider.');
        return this.mockInstance;
      }
      if (!this.geminiInstance) {
        this.geminiInstance = new GeminiProvider();
      }
      return this.geminiInstance;
    }

    if (selected === 'openai') {
      if (!config.openaiApiKey) {
        console.warn('[PROVIDER_FALLBACK] OPENAI_API_KEY is not set. Falling back to MockProvider.');
        return this.mockInstance;
      }
      if (!this.openaiInstance) {
        this.openaiInstance = new OpenAIProvider();
      }
      return this.openaiInstance;
    }

    // Default to mock
    return this.mockInstance;
  }

  public static getAvailableProviders(): Array<{ id: string; name: string; configured: boolean }> {
    return [
      { id: 'mock', name: 'Mock Engine (Deterministic & Fast)', configured: true },
      { id: 'gemini', name: 'Google Gemini (1.5 Flash / Pro)', configured: !!config.geminiApiKey },
      { id: 'openai', name: 'OpenAI (GPT-4o / GPT-4o-mini)', configured: !!config.openaiApiKey },
    ];
  }
}
