import { generateCacheKey } from "@/utils/cacheKey";
import { getCachedResponse, saveCachedResponse } from "./cacheService";
import { fetchFromGemini } from "./geminiService";
import { fetchFromGroq } from "./groqService";
import { fetchFromOpenAI } from "./openAiService";

/**
 * Strips markdown code blocks and trims extraneous text to return pure JSON.
 */
function cleanJSON(str: string): string {
  let cleaned = str.trim();

  // Strip ```json or ``` markdown wrapper blocks
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```/, "");
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.replace(/```$/, "");
  }
  cleaned = cleaned.trim();

  // Extract the JSON object or array if extraneous text surrounds it
  if (!cleaned.startsWith("{") && !cleaned.startsWith("[")) {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    } else {
      const firstBracket = cleaned.indexOf("[");
      const lastBracket = cleaned.lastIndexOf("]");
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        cleaned = cleaned.substring(firstBracket, lastBracket + 1);
      }
    }
  }

  return cleaned.trim();
}

export interface WaterfallProvider {
  name: string;
  fetch: (prompt: string) => Promise<string>;
}

/**
 * Master AI Service with Waterfall Fallback Architecture:
 * 1. Checks Firestore cache
 * 2. Waterfall Tier 1: Google Gemini
 * 3. Waterfall Tier 2: Groq (Llama / Qwen / GPT-OSS)
 * 4. Waterfall Tier 3: OpenAI (GPT-4o-mini)
 * 5. Saves successful response to cache
 */
export async function generateAIResponse(prompt: string): Promise<string> {
  const cacheKey = generateCacheKey(prompt);

  // Step 1: Check Cache
  const cachedData = await getCachedResponse(cacheKey);
  if (cachedData) {
    console.log("[AI Service] CACHE HIT");
    return cleanJSON(cachedData);
  }

  console.log("[AI Service] CACHE MISS - Starting AI Waterfall Pipeline");

  // Waterfall Provider Hierarchy
  const providers: WaterfallProvider[] = [
    { name: "Google Gemini", fetch: fetchFromGemini },
    { name: "Groq", fetch: fetchFromGroq },
    { name: "OpenAI", fetch: fetchFromOpenAI },
  ];

  const failureLog: { provider: string; error: string }[] = [];

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];
    try {
      console.log(`[AI Waterfall Tier ${i + 1}/${providers.length}] Attempting: ${provider.name}`);
      const rawText = await provider.fetch(prompt);
      const cleaned = cleanJSON(rawText);

      // Sanity check JSON parsing
      JSON.parse(cleaned);

      console.log(`[AI Waterfall Tier ${i + 1}] SUCCESS using ${provider.name}`);

      // Save to Cache asynchronously
      saveCachedResponse(cacheKey, cleaned).catch((cacheErr) =>
        console.warn("[AI Service] Cache save warning:", cacheErr)
      );

      return cleaned;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[AI Waterfall Tier ${i + 1}] ${provider.name} FAILED: ${errMsg}`);
      failureLog.push({ provider: provider.name, error: errMsg });

      const nextProvider = providers[i + 1];
      if (nextProvider) {
        console.log(`[AI Waterfall] Cascading over to Tier ${i + 2}: ${nextProvider.name}...`);
      }
    }
  }

  // All waterfall providers exhausted
  const summary = failureLog.map((f) => `[${f.provider}: ${f.error}]`).join(" -> ");
  console.error(`[AI Waterfall] All models failed in waterfall: ${summary}`);
  throw new Error(`All AI waterfall models failed. Breakdown: ${summary}`);
}
