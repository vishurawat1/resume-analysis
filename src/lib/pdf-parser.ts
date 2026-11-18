import zlib from "zlib";
import { extractText, getDocumentProxy } from "unpdf";
// @ts-expect-error - No types available for pdf-parse/lib/pdf-parse.js
import pdfParse from "pdf-parse/lib/pdf-parse.js";

/**
 * Robust, resilient multi-strategy PDF text extractor.
 * 
 * Strategy 1: unpdf (Modern Mozilla PDF.js build, handles modern PDF features without legacy lexer bugs)
 * Strategy 2: pdf-parse (Legacy parser fallback)
 * Strategy 3: Direct PDF content-stream decompression and BT...ET text extraction (immune to syntax/lexer dictionary crashes)
 */
export async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  let extractedText = "";

  // Strategy 1: Modern unpdf
  try {
    const doc = await getDocumentProxy(new Uint8Array(buffer));
    const result = await extractText(doc, { mergePages: true });
    if (result && typeof result.text === "string" && result.text.trim().length > 0) {
      return cleanExtractedText(result.text);
    }
  } catch (unpdfErr: unknown) {
    const msg = unpdfErr instanceof Error ? unpdfErr.message : String(unpdfErr);
    console.warn(`[PDF Parser] unpdf extraction failed, falling back to pdf-parse: ${msg}`);
  }

  // Strategy 2: Legacy pdf-parse
  try {
    const data = await pdfParse(buffer);
    if (data && typeof data.text === "string" && data.text.trim().length > 0) {
      return cleanExtractedText(data.text);
    }
  } catch (pdfParseErr: unknown) {
    const msg = pdfParseErr instanceof Error ? pdfParseErr.message : String(pdfParseErr);
    console.warn(`[PDF Parser] pdf-parse failed (e.g. ${msg}), falling back to stream extraction`);
  }

  // Strategy 3: Raw PDF content stream decompressor
  try {
    extractedText = extractTextFromPdfStreams(buffer);
    if (extractedText && extractedText.trim().length > 0) {
      return cleanExtractedText(extractedText);
    }
  } catch (streamErr: unknown) {
    console.warn("[PDF Parser] Stream extraction failed:", streamErr);
  }

  if (!extractedText || extractedText.trim().length === 0) {
    throw new Error(
      "Could not extract readable text from this PDF. Please ensure the file is not password-protected or a flat image-only scan, or try re-saving it as PDF or DOCX."
    );
  }

  return cleanExtractedText(extractedText);
}

function cleanExtractedText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n\s*\n/g, "\n\n")
    .trim();
}

function unescapePdfString(str: string): string {
  return str
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\b/g, "\b")
    .replace(/\\f/g, "\f")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");
}

/**
 * Pure binary stream extractor that scans for Flate/raw streams, decompresses them,
 * and extracts text strings between BT (Begin Text) and ET (End Text).
 * Completely bypasses PDF dictionary lexer crashes like `Illegal character: 41`.
 */
export function extractTextFromPdfStreams(buffer: Buffer): string {
  let fullText = "";
  let start = 0;

  while (start < buffer.length) {
    const streamIndex = buffer.indexOf("stream", start);
    if (streamIndex === -1) break;

    // Advance past 'stream' and newline (\r\n or \n or \r)
    let contentStart = streamIndex + 6;
    if (buffer[contentStart] === 0x0d && buffer[contentStart + 1] === 0x0a) {
      contentStart += 2;
    } else if (buffer[contentStart] === 0x0a || buffer[contentStart] === 0x0d) {
      contentStart += 1;
    }

    const endStreamIndex = buffer.indexOf("endstream", contentStart);
    if (endStreamIndex === -1) break;

    const slice = buffer.subarray(contentStart, endStreamIndex);
    let decompressed: Buffer | null = null;

    try {
      decompressed = zlib.inflateSync(slice);
    } catch {
      try {
        decompressed = zlib.inflateRawSync(slice);
      } catch {
        decompressed = slice;
      }
    }

    if (decompressed) {
      const content = decompressed.toString("latin1");
      const btBlocks = content.match(/BT[\s\S]*?ET/g);
      if (btBlocks) {
        for (const block of btBlocks) {
          // Extract (string) Tj / ' / "
          const tjMatches = block.matchAll(/\((.*?)\)\s*(?:Tj|'|")/g);
          for (const m of tjMatches) {
            fullText += unescapePdfString(m[1]) + " ";
          }

          // Extract [(string) 120 (string)] TJ
          const arrayMatches = block.matchAll(/\[([\s\S]*?)\]\s*TJ/g);
          for (const am of arrayMatches) {
            const inner = am[1].matchAll(/\((.*?)\)/g);
            for (const im of inner) {
              fullText += unescapePdfString(im[1]) + " ";
            }
          }
          fullText += "\n";
        }
      }
    }

    start = endStreamIndex + 9;
  }

  return fullText.trim();
}
