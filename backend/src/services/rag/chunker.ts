export interface ChunkMetadata {
  index: number;
  text: string;
  startChar: number;
  endChar: number;
  estimatedTokens: number;
}

export class RecursiveTextChunker {
  private chunkSize: number;
  private chunkOverlap: number;

  constructor(chunkSize: number = 600, chunkOverlap: number = 80) {
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
  }

  /**
   * Splits text into semantically coherent overlapping chunks
   * targeting paragraph and sentence boundaries.
   */
  public chunk(text: string): ChunkMetadata[] {
    const cleanText = text.trim();
    if (!cleanText) return [];

    if (cleanText.length <= this.chunkSize) {
      return [
        {
          index: 0,
          text: cleanText,
          startChar: 0,
          endChar: cleanText.length,
          estimatedTokens: Math.ceil(cleanText.length / 4),
        },
      ];
    }

    const chunks: ChunkMetadata[] = [];
    let start = 0;
    let index = 0;

    while (start < cleanText.length) {
      let end = start + this.chunkSize;

      if (end >= cleanText.length) {
        end = cleanText.length;
      } else {
        // Try to break at paragraph boundary first
        const paragraphBreak = cleanText.lastIndexOf('\n\n', end);
        if (paragraphBreak > start + (this.chunkSize / 2)) {
          end = paragraphBreak + 2;
        } else {
          // Try sentence boundary (period, question mark, exclamation followed by space)
          const sentenceBreak = Math.max(
            cleanText.lastIndexOf('. ', end),
            cleanText.lastIndexOf('? ', end),
            cleanText.lastIndexOf('! ', end)
          );
          if (sentenceBreak > start + (this.chunkSize / 2)) {
            end = sentenceBreak + 2;
          } else {
            // Fallback to space
            const spaceBreak = cleanText.lastIndexOf(' ', end);
            if (spaceBreak > start + (this.chunkSize / 2)) {
              end = spaceBreak + 1;
            }
          }
        }
      }

      const chunkText = cleanText.substring(start, end).trim();
      if (chunkText.length > 0) {
        chunks.push({
          index,
          text: chunkText,
          startChar: start,
          endChar: end,
          estimatedTokens: Math.ceil(chunkText.length / 4),
        });
        index++;
      }

      if (end >= cleanText.length) break;
      start = end - this.chunkOverlap;
    }

    return chunks;
  }
}
