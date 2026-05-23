import { model } from "@/lib/gemini";

/**
 * Sends a prompt to Gemini 1.5 Flash.
 * Throws an error if the quota is exceeded or the API fails.
 */
export async function fetchFromGemini(prompt: string): Promise<string> {
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
    },
  });

  const text = result.response.text();
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }
  
  return text;
}
