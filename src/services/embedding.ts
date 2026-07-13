/**
 * embedding.ts — Server-side Embedding Generation Service
 *
 * Generates vector embeddings using Gemini's `text-embedding-004` model.
 * Outputs 768-dimensional vectors, compatible with our PGVector schema.
 *
 * IMPORTANT: This file is server-only. Do not import from client code.
 */
import { GoogleGenAI } from "@google/genai";

const MODEL = "text-embedding-004";
const DIMENSIONS = 768;

let _ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI | null {
  if (_ai) return _ai;
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;
  _ai = new GoogleGenAI({ apiKey });
  return _ai;
}

/**
 * Generate a single embedding vector for the given text.
 * Returns a 768-dimensional float array.
 */
export async function embedText(text: string): Promise<number[]> {
  const ai = getAI();
  if (!ai) {
    // Fallback: Generate deterministic 768-dim mock vector from text hash when no GEMINI_API_KEY is configured
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }
    const mockVector: number[] = [];
    for (let i = 0; i < DIMENSIONS; i++) {
      mockVector.push(Math.sin(hash + i * 0.1) * 0.1);
    }
    return mockVector;
  }
  // Truncate to ~8000 chars to stay within token limits
  const truncated = text.slice(0, 8000);
  const result = await ai.models.embedContent({
    model: MODEL,
    contents: truncated,
    config: {
      outputDimensionality: DIMENSIONS,
    },
  });
  const values = result.embeddings?.[0]?.values;
  if (!values || values.length === 0) {
    throw new Error("Empty embedding returned from Gemini API");
  }
  return values;
}

/**
 * Batch embed multiple texts with a small delay between requests to respect
 * rate limits. Returns an array of embedding vectors in the same order.
 */
export async function embedBatch(
  texts: string[],
  delayMs = 200
): Promise<number[][]> {
  const results: number[][] = [];
  for (const text of texts) {
    results.push(await embedText(text));
    if (delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return results;
}
