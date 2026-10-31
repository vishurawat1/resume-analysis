import { getGeminiClient } from "@/lib/gemini";

/**
 * Sends a prompt to Google Gemini.
 * Tries the fast stable model gemini-3.5-flash-lite, with fallbacks.
 * Throws an error if quota is exceeded or the API fails to allow waterfall fallback.
 */
export async function fetchFromGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "dummy-key-to-prevent-crash") {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const genAI = getGeminiClient();
  const modelsToTry = ["gemini-3.5-flash-lite", "gemini-flash-latest"];
  let lastError: unknown = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json",
        },
      });

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const text = result.response.text();
      if (text && text.trim().length > 0) {
        return text;
      }
    } catch (err: unknown) {
      lastError = err;
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[Gemini Service] Model '${modelName}' failed: ${errMsg}`);
    }
  }

  throw lastError || new Error("Gemini returned an empty response.");
}
