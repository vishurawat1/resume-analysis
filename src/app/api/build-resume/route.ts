import { NextRequest, NextResponse } from "next/server";
import { generateAIResponse } from "@/services/aiService";
import { applyRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = applyRateLimit(req);
    if (rateLimitResponse) return rateLimitResponse;

    const { resumeText } = await req.json();

    if (!resumeText || typeof resumeText !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing resumeText" },
        { status: 400 }
      );
    }

    if (resumeText.length > 20000) {
      return NextResponse.json(
        { error: "Payload exceeds maximum allowed length" },
        { status: 400 }
      );
    }

    const prompt = `
You are an expert resume formatter.
I will provide you with the raw, unformatted text of a resume.
Your job is to parse this text and extract all information into a highly structured JSON object.
Do NOT hallucinate or add any information that is not present in the text.
Do NOT summarize or change the wording of the bullet points. Extract them exactly as written.

The JSON MUST perfectly match this structure:
{
  "personalInfo": {
    "name": "Extract full name",
    "email": "Extract email or empty string",
    "phone": "Extract phone or empty string",
    "location": "Extract location or empty string",
    "linkedin": "Extract linkedin URL or empty string",
    "github": "Extract github URL or empty string",
    "portfolio": "Extract portfolio URL or empty string"
  },
  "summary": "Extract professional summary if it exists, otherwise empty string",
  "experience": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "date": "Date range (e.g. Jan 2020 - Present)",
      "location": "Location if available",
      "bullets": ["Exact bullet point 1", "Exact bullet point 2"]
    }
  ],
  "education": [
    {
      "institution": "University or School Name",
      "degree": "Degree and Major",
      "date": "Graduation Date",
      "gpa": "GPA if available",
      "bullets": ["Any bullet points under education"]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Short description if available",
      "link": "Project URL if available",
      "date": "Date if available",
      "bullets": ["Exact bullet point 1", "Exact bullet point 2"]
    }
  ],
  "skills": [
    {
      "category": "e.g., Languages, Frameworks, Tools",
      "items": ["React", "TypeScript", "Node.js"]
    }
  ],
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "date": "Date"
    }
  ]
}

RESUME TEXT:
"""
${resumeText}
"""
    `;

    const text = await generateAIResponse(prompt);

    try {
      const parsedJSON = JSON.parse(text);
      return NextResponse.json(parsedJSON);
    } catch {
      console.error("Failed to parse JSON for PDF Build:", text);
      return NextResponse.json(
        { error: "AI failed to generate a valid document structure." },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error("Error in AI PDF build:", error);
    return NextResponse.json(
      { error: "Failed to generate structured resume." },
      { status: 500 }
    );
  }
}
