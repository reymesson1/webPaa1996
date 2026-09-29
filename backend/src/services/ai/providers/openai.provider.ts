import OpenAI from 'openai';
import { LLMMessage, LLMGenerationOptions, LLMResponse } from '../../../models/types';
import { LLMProvider } from './llmProvider.interface';
import { config } from '../../../config/env';

export class OpenAIProvider implements LLMProvider {
  public readonly name = 'openai';
  private client: OpenAI | null = null;
  private modelName: string;

  constructor(apiKey?: string, model?: string) {
    const key = apiKey || config.openaiApiKey;
    this.modelName = model || config.openaiModel;

    if (key) {
      this.client = new OpenAI({ apiKey: key });
    }
  }

  public async generateText(messages: LLMMessage[], options?: LLMGenerationOptions): Promise<LLMResponse> {
    if (!this.client) {
      throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY or switch to mock provider.');
    }

    const completion = await this.client.chat.completions.create({
      model: this.modelName,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options?.temperature ?? 0.2,
      max_tokens: options?.maxTokens ?? 2048,
      top_p: options?.topP ?? 0.95,
    });

    const choice = completion.choices[0];
    const content = choice.message?.content || '';

    return {
      content,
      promptTokens: completion.usage?.prompt_tokens ?? Math.ceil(messages.map(m => m.content).join('').length / 4),
      completionTokens: completion.usage?.completion_tokens ?? Math.ceil(content.length / 4),
      totalTokens: completion.usage?.total_tokens ?? 0,
      model: this.modelName,
      finishReason: choice.finish_reason ?? 'stop',
    };
  }

  public async streamText(
    messages: LLMMessage[],
    onToken: (token: string) => void,
    options?: LLMGenerationOptions
  ): Promise<LLMResponse> {
    if (!this.client) {
      throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY or switch to mock provider.');
    }

    const stream = await this.client.chat.completions.create({
      model: this.modelName,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options?.temperature ?? 0.2,
      max_tokens: options?.maxTokens ?? 2048,
      top_p: options?.topP ?? 0.95,
      stream: true,
      stream_options: { include_usage: true },
    });

    let fullText = '';
    let promptTokens = 0;
    let completionTokens = 0;
    let totalTokens = 0;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (delta) {
        fullText += delta;
        onToken(delta);
      }
      if (chunk.usage) {
        promptTokens = chunk.usage.prompt_tokens;
        completionTokens = chunk.usage.completion_tokens;
        totalTokens = chunk.usage.total_tokens;
      }
    }

    if (totalTokens === 0) {
      promptTokens = Math.ceil(messages.map(m => m.content).join('').length / 4);
      completionTokens = Math.ceil(fullText.length / 4);
      totalTokens = promptTokens + completionTokens;
    }

    return {
      content: fullText,
      promptTokens,
      completionTokens,
      totalTokens,
      model: this.modelName,
      finishReason: 'stop',
    };
  }
}
