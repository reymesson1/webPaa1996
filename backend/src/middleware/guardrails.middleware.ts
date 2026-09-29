import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

export interface GuardrailResult {
  sanitizedText: string;
  piiDetected: boolean;
  piiMatchesCount: number;
  injectionDetected: boolean;
  injectionFlags: string[];
}

export class GuardrailService {
  // Regex patterns for Common PII Entities
  private static PII_PATTERNS: Record<string, RegExp> = {
    SSN: /\b\d{3}[- ]?\d{2}[- ]?\d{4}\b/g,
    CREDIT_CARD: /\b(?:\d{4}[ -]?){3}\d{4}\b/g,
    EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g,
    PHONE: /\b(?:\+?1[-.\s]?)?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    API_KEY_OR_TOKEN: /\b(?:sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{20,}|AIzaSy[a-zA-Z0-9-_]{33})\b/g,
  };

  // Heuristic patterns for Prompt Injection and Jailbreaks
  private static INJECTION_PATTERNS = [
    { name: 'instruction_override', regex: /(?:ignore|disregard|forget|bypass)\s+(?:all\s+)?(?:previous|prior|above)\s+(?:instructions|directions|prompts|rules)/i },
    { name: 'roleplay_jailbreak', regex: /(?:you are now|pretend to be|act as|simulate)\s+(?:an unrestricted|DAN|jailbroken|evil|unfiltered|developer mode)/i },
    { name: 'system_leak', regex: /(?:reveal|print|repeat|output|show)\s+(?:your|the)\s+(?:system prompt|initial prompt|hidden instructions|developer prompt)/i },
    { name: 'delimiter_tampering', regex: /(?:<<<|>>>|\[SYSTEM\]|<\|im_start\|>|<\|im_end\|>)/i },
  ];

  public static inspectAndSanitize(text: string): GuardrailResult {
    let sanitized = text;
    let piiDetected = false;
    let piiMatchesCount = 0;
    const injectionFlags: string[] = [];

    // 1. PII Redaction
    if (config.enablePiiRedaction) {
      for (const [type, pattern] of Object.entries(this.PII_PATTERNS)) {
        const matches = sanitized.match(pattern);
        if (matches && matches.length > 0) {
          piiDetected = true;
          piiMatchesCount += matches.length;
          sanitized = sanitized.replace(pattern, `[REDACTED_${type}]`);
        }
      }
    }

    // 2. Prompt Injection Screening
    for (const item of this.INJECTION_PATTERNS) {
      if (item.regex.test(text)) {
        injectionFlags.push(item.name);
      }
    }

    return {
      sanitizedText: sanitized,
      piiDetected,
      piiMatchesCount,
      injectionDetected: injectionFlags.length > 0,
      injectionFlags,
    };
  }

  /**
   * Encapsulate user-provided content in strict delimiter tags to prevent
   * prompt escape attacks.
   */
  public static wrapInSafeDelimiter(text: string, label: string = 'USER_CONTENT'): string {
    // Strip any rogue delimiter tokens if present inside the user input
    const cleanText = text.replace(/<<<|>>>/g, '');
    return `<<<START_${label}>>>\n${cleanText}\n<<<END_${label}>>>`;
  }
}

/**
 * Express middleware for checking request input lengths and applying guardrails.
 */
export const guardrailsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const body = req.body;
  if (!body) return next();

  // Validate maximum document/text length
  if (body.content && typeof body.content === 'string') {
    if (body.content.length > config.maxDocumentLengthChars) {
      return res.status(400).json({
        error: `Content exceeds maximum allowed length of ${config.maxDocumentLengthChars} characters.`,
      });
    }

    // Inspect content
    const result = GuardrailService.inspectAndSanitize(body.content);
    // Attach audit metadata
    (req as any).guardrailResult = result;
    // Replace raw content with sanitized text for downstream processing
    body.sanitizedContent = result.sanitizedText;
  }

  // Check user queries for injection attacks
  if (body.question && typeof body.question === 'string') {
    const queryResult = GuardrailService.inspectAndSanitize(body.question);
    if (queryResult.injectionDetected) {
      // Log for audit but neutralize rather than crashing
      console.warn(`[SECURITY] Prompt injection heuristic flagged: ${queryResult.injectionFlags.join(', ')} from IP: ${req.ip}`);
    }
    (req as any).queryGuardrailResult = queryResult;
    body.sanitizedQuestion = queryResult.sanitizedText;
  }

  next();
};
