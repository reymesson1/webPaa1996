import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMMessage, LLMGenerationOptions, LLMResponse } from '../../../models/types';
import { LLMProvider } from './llmProvider.interface';
import { config } from '../../../config/env';

export class GeminiProvider implements LLMProvider {
  public readonly name = 'google-gemini';
  private genAI: GoogleGenerativeAI | null = null;
  private modelName: string;

  constructor(apiKey?: string, model?: string) {
    const key = apiKey || config.geminiApiKey;
    this.modelName = model || config.geminiModel;

    if (key) {
      this.genAI = new GoogleGenerativeAI(key);
    }
  }

  public async generateText(messages: LLMMessage[], options?: LLMGenerationOptions): Promise<LLMResponse> {
    if (!this.genAI) {
      throw new Error('Gemini API key is not configured. Please set GEMINI_API_KEY or switch to mock provider.');
    }

    const systemInstruction = messages.find(m => m.role === 'system')?.content;
    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      systemInstruction: systemInstruction ? { role: 'system', parts: [{ text: systemInstruction }] } : undefined,
      generationConfig: {
        temperature: options?.temperature ?? 0.2,
        maxOutputTokens: options?.maxTokens ?? 2048,
        topP: options?.topP ?? 0.95,
      },
    });

    const userPrompt = messages.filter(m => m.role !== 'system').map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
    const result = await model.generateContent(userPrompt);
    const response = await result.response;
    const content = response.text();

    const promptTokens = Math.ceil(userPrompt.length / 4);
    const completionTokens = Math.ceil(content.length / 4);

    return {
      content,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      model: this.modelName,
      finishReason: 'stop',
    };
  }

  public async streamText(
    messages: LLMMessage[],
    onToken: (token: string) => void,
    options?: LLMGenerationOptions
  ): Promise<LLMResponse> {
    if (!this.genAI) {
      throw new Error('Gemini API key is not configured. Please set GEMINI_API_KEY or switch to mock provider.');
    }

    const systemInstruction = messages.find(m => m.role === 'system')?.content;
    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      systemInstruction: systemInstruction ? { role: 'system', parts: [{ text: systemInstruction }] } : undefined,
      generationConfig: {
        temperature: options?.temperature ?? 0.2,
        maxOutputTokens: options?.maxTokens ?? 2048,
        topP: options?.topP ?? 0.95,
      },
    });

    const userPrompt = messages.filter(m => m.role !== 'system').map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
    const streamingResult = await model.generateContentStream(userPrompt);

    let fullText = '';
    for await (const chunk of streamingResult.stream) {
      const chunkText = chunk.text();
      fullText += chunkText;
      onToken(chunkText);
    }

    const promptTokens = Math.ceil(userPrompt.length / 4);
    const completionTokens = Math.ceil(fullText.length / 4);

    return {
      content: fullText,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      model: this.modelName,
      finishReason: 'stop',
    };
  }
}
