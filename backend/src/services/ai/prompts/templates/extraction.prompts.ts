import { GuardrailService } from '../../../../middleware/guardrails.middleware';

export interface ExtractionPromptContext {
  documentTitle: string;
  documentContent: string;
}

export const extractionPrompts = {
  v1: {
    version: 'v1',
    description: 'Basic JSON entity extraction and summary',
    temperature: 0.1,
    maxTokens: 1500,
    buildSystemInstruction: () => {
      return (
        `You are a document analyzer. Extract structured JSON containing:\n` +
        `- summary (string)\n` +
        `- classification ({ category, primaryTopic, confidentialityLevel, sentiment })\n` +
        `- keyEntities (array of { name, type, context })\n` +
        `- actionItems (array of { task, priority, assignee })\n` +
        `- confidenceScore (number 0.0 to 1.0)\n` +
        `- language (string)\n` +
        `Output ONLY valid JSON.`
      );
    },
    buildUserPrompt: (ctx: ExtractionPromptContext) => {
      const safeContent = GuardrailService.wrapInSafeDelimiter(ctx.documentContent, 'DOCUMENT_CONTENT');
      return (
        `Analyze the following document titled "${ctx.documentTitle}":\n\n` +
        `${safeContent}\n\n` +
        `Return the structured JSON output.`
      );
    },
  },

  v2: {
    version: 'v2',
    description: 'Enterprise Structured Intelligence with Zod schema alignment, entity disambiguation, and confidence calibration',
    temperature: 0.05,
    maxTokens: 2000,
    buildSystemInstruction: () => {
      return (
        `You are DocIntel AI's structured metadata extraction engine.\n\n` +
        `TASK:\n` +
        `Read the provided document and produce a strictly compliant JSON document adhering to this schema:\n` +
        `{\n` +
        `  "summary": "2-3 concise sentences summarizing key takeaways",\n` +
        `  "classification": {\n` +
        `    "category": "Technical" | "Legal" | "Financial" | "Research" | "Memo" | "General",\n` +
        `    "primaryTopic": "Core subject",\n` +
        `    "confidentialityLevel": "Public" | "Internal" | "Confidential" | "Restricted",\n` +
        `    "sentiment": "Positive" | "Neutral" | "Negative" | "Urgent"\n` +
        `  },\n` +
        `  "keyEntities": [\n` +
        `    { "name": "Entity Name", "type": "Organization" | "Person" | "Date" | "Financial" | "Metric" | "Other", "context": "Brief relevance" }\n` +
        `  ],\n` +
        `  "actionItems": [\n` +
        `    { "task": "Action description", "priority": "High" | "Medium" | "Low", "assignee": "Optional role or person" }\n` +
        `  ],\n` +
        `  "confidenceScore": 0.0 to 1.0,\n` +
        `  "language": "English"\n` +
        `}\n\n` +
        `RULES:\n` +
        `1. Output RAW JSON ONLY. No markdown formatting, no backticks, no explanatory text.\n` +
        `2. Ground all entities and action items strictly in the document text.\n` +
        `3. If no action items exist, return an empty array [].`
      );
    },
    buildUserPrompt: (ctx: ExtractionPromptContext) => {
      const safeContent = GuardrailService.wrapInSafeDelimiter(ctx.documentContent, 'DOCUMENT_CONTENT');
      return (
        `Document Title: "${ctx.documentTitle}"\n\n` +
        `${safeContent}\n\n` +
        `Generate the validated JSON output now.`
      );
    },
  },
};
