import { NextRequest, NextResponse } from "next/server";
import { parsePdfBuffer } from "@/lib/pdf-parser";
import mammoth from "mammoth";
import { applyRateLimit } from "@/lib/rate-limit";
import { isSameOriginBrowserRequest, verifyRequestUser } from "@/lib/serverAuth";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  try {
    const user = await verifyRequestUser(req);
    if (!user && !isSameOriginBrowserRequest(req)) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const rateLimitResponse = applyRateLimit(req, {
      bucket: "parse",
      identityKey: user?.uid,
      limit: user ? 45 : 15,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }
    
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File exceeds the 5MB size limit" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let extractedText = "";

    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      extractedText = await parsePdfBuffer(buffer);
    } else if (
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.toLowerCase().endsWith(".docx")
    ) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF or DOCX file." },
        { status: 400 }
      );
    }

    // Clean up the text a bit
    extractedText = extractedText.replace(/\n\s*\n/g, '\n\n').trim();

    return NextResponse.json({ text: extractedText });
  } catch (error: unknown) {
    console.error("Error parsing document:", error);
    let errorMessage = error instanceof Error ? error.message : "Failed to parse document";
    if (errorMessage.includes("Illegal character") || errorMessage.includes("FormatError")) {
      errorMessage = "The uploaded PDF has malformed internal syntax or an unsupported font encoding. Please re-save or re-export it as a clean PDF or DOCX file.";
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
