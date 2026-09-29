import { LLMMessage, LLMGenerationOptions, LLMResponse } from '../../../models/types';
import { LLMProvider } from './llmProvider.interface';

export class MockProvider implements LLMProvider {
  public readonly name = 'mock-llm-engine';

  public async generateText(messages: LLMMessage[], _options?: LLMGenerationOptions): Promise<LLMResponse> {
    const userMsg = messages.find(m => m.role === 'user')?.content || '';
    const isExtraction = userMsg.includes('JSON') || userMsg.includes('schema') || userMsg.includes('classification');

    const content = isExtraction
      ? this.generateMockExtraction(userMsg)
      : this.generateMockQA(userMsg);

    const promptTokens = Math.ceil(messages.map(m => m.content).join(' ').length / 4);
    const completionTokens = Math.ceil(content.length / 4);

    return {
      content,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      model: 'mock-llm-engine-v1',
      finishReason: 'stop',
    };
  }

  public async streamText(
    messages: LLMMessage[],
    onToken: (token: string) => void,
    options?: LLMGenerationOptions
  ): Promise<LLMResponse> {
    const response = await this.generateText(messages, options);
    const words = response.content.split(' ');

    // Simulate natural streaming token intervals
    for (const word of words) {
      onToken(word + ' ');
      await new Promise(resolve => setTimeout(resolve, 25));
    }

    return response;
  }

  private generateMockQA(userPrompt: string): string {
    return (
      `Based on the provided document excerpts [Source Chunk 1], here is the verified assessment:\n\n` +
      `The document outlines specific objectives, operational guidelines, and architectural decisions. ` +
      `Specifically, all requirements emphasize end-to-end reliability, strict security isolation, and data integrity. ` +
      `Key metrics mentioned in the context indicate compliance with production SLAs and audit requirements [Source Chunk 1].\n\n` +
      `*Confidence Assessment: High (94%) — Grounded in primary source text.*`
    );
  }

  private generateMockExtraction(userPrompt: string): string {
    // Generate valid JSON conforming to StructuredInsightsSchema
    const docSnippet = userPrompt.substring(0, 300).replace(/\n/g, ' ');
    return JSON.stringify(
      {
        summary: `Executive review of the ingested text: The document provides foundational specifications, system constraints, and operational deliverables. Key focus is placed on architectural coherence and security benchmarks.`,
        classification: {
          category: userPrompt.toLowerCase().includes('contract') ? 'Legal' : 'Technical',
          primaryTopic: 'System Specification & Architecture',
          confidentialityLevel: 'Internal',
          sentiment: 'Positive',
        },
        keyEntities: [
          { name: 'Core Platform Engine', type: 'Organization', context: 'Primary system component' },
          { name: 'Q4 2026 Milestone', type: 'Date', context: 'Target production delivery timeframe' },
          { name: '99.9% Uptime Target', type: 'Metric', context: 'Service Level Agreement parameter' },
        ],
        actionItems: [
          { task: 'Deploy containerized services to staging environment', priority: 'High', assignee: 'DevOps Lead' },
          { task: 'Audit rate limits and prompt sanitization boundaries', priority: 'Medium', assignee: 'Security Team' },
          { task: 'Conduct end-to-end evaluation benchmark over golden dataset', priority: 'High', assignee: 'AI Engineer' },
        ],
        confidenceScore: 0.94,
        language: 'English',
      },
      null,
      2
    );
  }
}
