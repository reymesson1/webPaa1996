import { qaPrompts } from './templates/qa.prompts';
import { extractionPrompts } from './templates/extraction.prompts';
import { config } from '../../../config/env';

export class PromptRegistry {
  public static getQAPrompt(version?: string) {
    const selectedVersion = (version || config.defaultPromptVersion).toLowerCase();
    if (selectedVersion === 'v1') return qaPrompts.v1;
    return qaPrompts.v2; // Default to v2
  }

  public static getExtractionPrompt(version?: string) {
    const selectedVersion = (version || config.defaultPromptVersion).toLowerCase();
    if (selectedVersion === 'v1') return extractionPrompts.v1;
    return extractionPrompts.v2; // Default to v2
  }

  public static listAvailableVersions() {
    return [
      {
        version: 'v1',
        name: 'Standard Direct Grounding',
        description: qaPrompts.v1.description,
        recommended: false,
      },
      {
        version: 'v2',
        name: 'Enterprise CoT with Citation Verification',
        description: qaPrompts.v2.description,
        recommended: true,
      },
    ];
  }
}
