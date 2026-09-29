import { LLMMessage, LLMGenerationOptions, LLMResponse } from '../../../models/types';

export interface LLMProvider {
  readonly name: string;
  generateText(messages: LLMMessage[], options?: LLMGenerationOptions): Promise<LLMResponse>;
  streamText(
    messages: LLMMessage[], 
    onToken: (token: string) => void, 
    options?: LLMGenerationOptions
  ): Promise<LLMResponse>;
}
