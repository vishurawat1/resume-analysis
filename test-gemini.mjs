import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local', override: true });

async function run() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });
    const result = await model.generateContent("Hello");
    console.log("Gemini Response:", result.response.text());
  } catch (error) {
    console.error("Error with gemini-3.5-flash-lite:", error.message);
  }
}
run();
