/**
 * chunker.ts — Intelligent Document Text Chunker
 *
 * Splits large text into semantically coherent chunks suitable for embedding.
 * Uses a recursive character/paragraph strategy that preserves context.
 *
 * Strategy:
 *  1. Split on double newlines (paragraphs)
 *  2. If a paragraph exceeds maxChunkSize, recursively split on single newlines, then sentences
 *  3. Merge small adjacent pieces into chunks up to maxChunkSize with overlap
 */

export interface TextChunk {
  content: string;
  chunkIndex: number;
}

const DEFAULT_CHUNK_SIZE = 1000;   // characters
const DEFAULT_OVERLAP    = 150;    // characters of overlap between adjacent chunks

/**
 * Recursively split text into pieces that respect semantic boundaries.
 * Priority: paragraphs → lines → sentence boundaries → hard split.
 */
function splitRecursively(text: string, maxSize: number): string[] {
  if (text.length <= maxSize) return [text];

  const separators = ["\n\n", "\n", ". ", "? ", "! ", " ", ""];

  for (const sep of separators) {
    if (!sep) {
      // Hard split as last resort
      const pieces: string[] = [];
      for (let i = 0; i < text.length; i += maxSize) {
        pieces.push(text.slice(i, i + maxSize));
      }
      return pieces;
    }

    if (text.includes(sep)) {
      const parts = text.split(sep).filter((p) => p.trim().length > 0);
      if (parts.length > 1) {
        // Recursively split each part if still too long
        return parts.flatMap((p) =>
          p.length > maxSize ? splitRecursively(p, maxSize) : [p]
        );
      }
    }
  }

  return [text];
}

/**
 * Merge small pieces into chunks, adding overlap from the previous chunk.
 */
function mergeWithOverlap(
  pieces: string[],
  maxSize: number,
  overlap: number
): string[] {
  const chunks: string[] = [];
  let current = "";
  let overlapBuffer = "";

  for (const piece of pieces) {
    const candidate = current ? `${current}\n\n${piece}` : piece;

    if (candidate.length <= maxSize) {
      current = candidate;
    } else {
      if (current) {
        chunks.push(current.trim());
        // Keep last `overlap` chars as context for the next chunk
        overlapBuffer = current.slice(-overlap);
      }
      current = overlapBuffer ? `${overlapBuffer}\n\n${piece}` : piece;
      overlapBuffer = "";
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks.filter((c) => c.length > 0);
}

/**
 * Main export: split `text` into overlapping chunks ready for embedding.
 *
 * @param text        - Full document text extracted by AI
 * @param maxChunkSize - Target maximum character count per chunk (default 1000)
 * @param overlap      - Character overlap between adjacent chunks (default 150)
 */
export function chunkText(
  text: string,
  maxChunkSize: number = DEFAULT_CHUNK_SIZE,
  overlap: number = DEFAULT_OVERLAP
): TextChunk[] {
  if (!text || text.trim().length === 0) return [];

  const pieces = splitRecursively(text.trim(), maxChunkSize);
  const merged = mergeWithOverlap(pieces, maxChunkSize, overlap);

  return merged.map((content, chunkIndex) => ({ content, chunkIndex }));
}
