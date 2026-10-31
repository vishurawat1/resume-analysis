import OpenAI from "openai";

/**
 * Creates or retrieves an official OpenAI client instance.
 * Explicitly targets api.openai.com/v1 to avoid accidental proxy hijacks.
 */
export const getOpenAIClient = () => {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "dummy-key-to-prevent-crash",
    baseURL: process.env.OPENAI_API_BASE_URL || "https://api.openai.com/v1",
  });
};

export const openai = getOpenAIClient();
