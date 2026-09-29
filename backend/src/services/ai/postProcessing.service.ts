import { StructuredInsights, StructuredInsightsSchema, Citation } from '../../models/types';

export interface PostProcessedResponse {
  cleanContent: string;
  citedChunks: number[];
  confidenceScore: number;
  isUncertain: boolean;
  uncertaintyReason?: string;
}

export class ResponsePostProcessor {
  /**
   * Cleans, validates, and parses structured JSON output from LLM
   */
  public static parseAndValidateStructuredInsights(rawContent: string): StructuredInsights {
    // 1. Strip potential Markdown code blocks (e.g. ```json ... ```)
    let cleaned = rawContent.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    }

    // 2. Parse JSON
    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err: any) {
      console.warn('[POST_PROCESS] Failed direct JSON parse, attempting substring recovery...', err.message);
      // Attempt recovery by locating the first { and last }
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        const jsonSubstring = cleaned.substring(firstBrace, lastBrace + 1);
        parsed = JSON.parse(jsonSubstring);
      } else {
        throw new Error('LLM response could not be parsed as valid JSON: ' + err.message);
      }
    }

    // 3. Validate against Zod schema
    const validationResult = StructuredInsightsSchema.safeParse(parsed);
    if (!validationResult.success) {
      console.warn('[POST_PROCESS] Schema validation mismatch, applying safe defaults:', validationResult.error.format());
      // Graceful fallback with sanitized defaults if minor fields deviate
      return {
        summary: parsed.summary || 'Summary unavailable due to format inconsistency.',
        classification: {
          category: parsed.classification?.category || 'General',
          primaryTopic: parsed.classification?.primaryTopic || 'Unspecified',
          confidentialityLevel: parsed.classification?.confidentialityLevel || 'Internal',
          sentiment: parsed.classification?.sentiment || 'Neutral',
        },
        keyEntities: Array.isArray(parsed.keyEntities) ? parsed.keyEntities : [],
        actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
        confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.75,
        language: parsed.language || 'English',
      };
    }

    return validationResult.data;
  }

  /**
   * Post-processes QA response text, detects cited chunks, and calibrates confidence
   */
  public static processQAResponse(
    rawText: string, 
    retrievedCitations: Citation[], 
    ragRelevanceScore: number
  ): PostProcessedResponse {
    let cleanContent = rawText.trim();
    const citedChunks: number[] = [];

    // Detect [Source Chunk X] or [Chunk X] mentions
    const chunkRegex = /\[(?:Source\s+)?Chunk\s+(\d+)\]/gi;
    let match: RegExpExecArray | null;
    while ((match = chunkRegex.exec(cleanContent)) !== null) {
      const chunkIdx = parseInt(match[1], 10);
      if (!citedChunks.includes(chunkIdx)) {
        citedChunks.push(chunkIdx);
      }
    }

    // Check for refusal / lack of context signals
    const refusalPatterns = [
      /not\s+(?:mentioned|found|present|stated)\s+in\s+the\s+(?:provided\s+)?document/i,
      /excerpts\s+do\s+not\s+contain/i,
      /cannot\s+(?:answer|determine)\s+based\s+on/i,
      /insufficient\s+information/i,
    ];

    const hasRefusalSignal = refusalPatterns.some(pattern => pattern.test(cleanContent));

    // Confidence calibration
    let confidenceScore = Math.max(0.2, ragRelevanceScore);

    if (hasRefusalSignal) {
      confidenceScore = 0.35; // Lower confidence when info is missing
    } else if (citedChunks.length > 0 && ragRelevanceScore > 0.4) {
      confidenceScore = Math.min(0.98, ragRelevanceScore * 1.1);
    }

    const isUncertain = confidenceScore < 0.45 || ragRelevanceScore < 0.15;

    return {
      cleanContent,
      citedChunks,
      confidenceScore: Math.round(confidenceScore * 100) / 100,
      isUncertain,
      uncertaintyReason: isUncertain
        ? 'Low retrieval relevance score or primary source lacks explicit reference to this query.'
        : undefined,
    };
  }
}
