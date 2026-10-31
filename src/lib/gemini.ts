import { GoogleGenerativeAI } from "@google/generative-ai";

export const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || "dummy-key-to-prevent-crash";
  return new GoogleGenerativeAI(apiKey);
};

export const model = getGeminiClient().getGenerativeModel({
  model: "gemini-3.5-flash-lite",
});
