import { getGroqClient } from "@/lib/groq";

/**
 * Sends a prompt to Groq.
 * Uses high-performance models (openai/gpt-oss-120b, openai/gpt-oss-20b, qwen/qwen3.8-27b).
 * Throws an error if quota is exceeded or the API fails to trigger waterfall cascade.
 */
export async function fetchFromGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === "dummy-key-to-prevent-crash") {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const groqClient = getGroqClient();
  const modelsToTry = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
  ];
  let lastError: unknown = null;

  for (const model of modelsToTry) {
    try {
      const response = await groqClient.chat.completions.create({
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
      console.warn(`[Groq Service] Model '${model}' failed: ${errMsg}`);
    }
  }

  throw lastError || new Error("Groq returned an empty response.");
}
