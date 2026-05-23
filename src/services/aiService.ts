import { generateCacheKey } from "@/utils/cacheKey";
import { getCachedResponse, saveCachedResponse } from "./cacheService";
import { fetchFromGemini } from "./geminiService";
import { fetchFromGroq } from "./groqService";

/**
 * Master AI Service
 * 1. Checks Firestore cache
 * 2. Tries Gemini Flash
 * 3. Falls back to OpenRouter (DeepSeek)
 * 4. Saves response to cache
 */
function cleanJSON(str: string): string {
  let cleaned = str.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```/, "");
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.replace(/```$/, "");
  }
  return cleaned.trim();
}

export async function generateAIResponse(prompt: string): Promise<string> {
  const cacheKey = generateCacheKey(prompt);

  // Step 1: Check Cache
  const cachedData = await getCachedResponse(cacheKey);
  if (cachedData) {
    console.log("[AI Service] CACHE HIT");
    return cleanJSON(cachedData);
  }
  
  console.log("[AI Service] CACHE MISS");

  let responseText = "";

  // Step 2: Try Gemini API
  try {
    console.log("[AI Service] USING GEMINI");
    responseText = await fetchFromGemini(prompt);
    } catch (geminiError) {
      console.error("[AI Service] Gemini failed:", geminiError);
      
      console.log("[AI Service] USING GROQ FALLBACK");
      try {
        let groqResponse = await fetchFromGroq(prompt);
        groqResponse = cleanJSON(groqResponse);
        await saveCachedResponse(cacheKey, groqResponse);
        return groqResponse;
      } catch (groqError) {
        console.error("[AI Service] Groq fallback failed:", groqError);
        throw new Error("Both Gemini and Groq fallback failed to process the request.");
      }
    }

  // Step 4: Save to Cache
  if (responseText) {
    responseText = cleanJSON(responseText);
    await saveCachedResponse(cacheKey, responseText);
  }

  return responseText;
}
