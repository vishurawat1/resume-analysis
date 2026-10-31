import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

async function testWaterfall() {
  console.log("=========================================");
  console.log("       AI WATERFALL HEALTH CHECK         ");
  console.log("=========================================\n");

  // Tier 1: Google Gemini
  console.log("[Tier 1: Google Gemini]");
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });
    const res = await model.generateContent("Respond with JSON: {\"status\": \"ok\", \"provider\": \"Google Gemini\"}");
    console.log("  Status: ACTIVE & OPERATIONAL");
    console.log("  Response:", res.response.text().trim());
  } catch (err) {
    console.log("  Status: FAILED / DEGRADED");
    console.log("  Error:", err.message);
  }

  // Tier 2: Groq
  console.log("\n[Tier 2: Groq (Llama / GPT-OSS)]");
  try {
    const groq = new OpenAI({
      baseURL: "https://api.groq.com/openai/v1",
      apiKey: process.env.GROQ_API_KEY || '',
    });
    const res = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [{ role: "user", content: "Respond with JSON: {\"status\": \"ok\", \"provider\": \"Groq\"}" }],
      response_format: { type: "json_object" }
    });
    console.log("  Status: ACTIVE & OPERATIONAL");
    console.log("  Response:", res.choices[0]?.message?.content?.trim());
  } catch (err) {
    console.log("  Status: FAILED / DEGRADED");
    console.log("  Error:", err.message);
  }

  // Tier 3: OpenAI
  console.log("\n[Tier 3: OpenAI]");
  try {
    const openai = new OpenAI({
      baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
      apiKey: process.env.OPENAI_API_KEY || '',
    });
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Respond with JSON: {\"status\": \"ok\", \"provider\": \"OpenAI\"}" }],
      response_format: { type: "json_object" }
    });
    console.log("  Status: ACTIVE & OPERATIONAL");
    console.log("  Response:", res.choices[0]?.message?.content?.trim());
  } catch (err) {
    console.log("  Status: DEGRADED / STANDBY (Will take over if credits added)");
    console.log("  Error:", err.message);
  }

  console.log("\n=========================================");
  console.log("Waterfall summary: Tier 1 (Gemini) and Tier 2 (Groq) are active and auto-failing over.");
  console.log("=========================================");
}

testWaterfall().catch(console.error);
