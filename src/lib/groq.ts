import OpenAI from "openai";

/**
 * Creates or retrieves a Groq client instance using the OpenAI SDK.
 * Configured specifically for Groq's high-speed endpoint.
 */
export const getGroqClient = () => {
  return new OpenAI({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY || "dummy-key-to-prevent-crash",
  });
};

export const groq = getGroqClient();
