import { groq } from "@/lib/groq";

/**
 * Sends a prompt to Groq.
 * Throws an error if the quota is exceeded or the API fails.
 */
export async function fetchFromGroq(prompt: string): Promise<string> {
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    response_format: { type: "json_object" }
  });

  const text = response.choices[0]?.message?.content;
  if (!text) {
    throw new Error("Groq returned an empty response.");
  }
  
  return text;
}
