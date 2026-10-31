import { getOpenAIClient } from "@/lib/openai";

/**
 * Sends a prompt to OpenAI.
 * Tries fast cost-effective models (gpt-4o-mini, gpt-4.1-mini, gpt-4o).
 * Throws an error if quota is exceeded or the API fails.
 */
export async function fetchFromOpenAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "dummy-key-to-prevent-crash") {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const client = getOpenAIClient();
  const modelsToTry = ["gpt-4o-mini", "gpt-4.1-mini", "gpt-4o"];
  let lastError: unknown = null;

  for (const model of modelsToTry) {
    try {
      const response = await client.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const text = response.choices[0]?.message?.content;
      if (text && text.trim().length > 0) {
        return text;
      }
    } catch (err: unknown) {
      lastError = err;
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[OpenAI Service] Model '${model}' failed: ${errMsg}`);
    }
  }

  throw lastError || new Error("OpenAI returned an empty response.");
}
