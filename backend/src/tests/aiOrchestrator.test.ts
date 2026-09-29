import { describe, it, expect } from 'vitest';
import { AIOrchestratorService } from '../services/ai/aiOrchestrator.service';
import { PromptRegistry } from '../services/ai/prompts/promptRegistry';
import { ResponsePostProcessor } from '../services/ai/postProcessing.service';
import { StructuredInsightsSchema } from '../models/types';

describe('AI Orchestrator & Post-Processing', () => {
  it('should support switching between prompt version v1 and v2', () => {
    const p1 = PromptRegistry.getQAPrompt('v1');
    const p2 = PromptRegistry.getQAPrompt('v2');

    expect(p1.version).toBe('v1');
    expect(p2.version).toBe('v2');
    expect(p1.description).not.toEqual(p2.description);
  });

  it('should extract and validate structured insights conforming to Zod schema', async () => {
    const title = 'Infrastructure Modernization RFC';
    const content =
      'This proposal outlines the migration of legacy monolithic services to an event-driven AWS ECS Fargate architecture. ' +
      'Expected timeline is Q4 2026. Action item: Lead architect must finalize VPC peering configuration by next Friday.';

    const result = await AIOrchestratorService.extractDocumentInsights(title, content, 'v2', 'mock');

    expect(result.insights).toBeDefined();
    // Validate against strict Zod schema
    const parsed = StructuredInsightsSchema.safeParse(result.insights);
    expect(parsed.success).toBe(true);

    expect(result.insights.summary).toBeDefined();
    expect(result.insights.classification.category).toBeDefined();
    expect(result.insights.keyEntities.length).toBeGreaterThan(0);
    expect(result.insights.actionItems.length).toBeGreaterThan(0);
    expect(result.tokensUsed).toBeGreaterThan(0);
  });

  it('should post-process QA responses and detect citations', () => {
    const rawAnswer =
      'Based on the specification [Source Chunk 1], the database requires automated daily snapshots. ' +
      'Furthermore, rate limits are capped at 60 requests per minute [Source Chunk 2].';

    const processed = ResponsePostProcessor.processQAResponse(rawAnswer, [], 0.85);

    expect(processed.citedChunks).toContain(1);
    expect(processed.citedChunks).toContain(2);
    expect(processed.confidenceScore).toBeGreaterThan(0.7);
    expect(processed.isUncertain).toBe(false);
  });
});
