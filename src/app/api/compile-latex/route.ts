import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/rate-limit";
import { verifyRequestUser } from "@/lib/serverAuth";
import { generateCacheKey } from "@/utils/cacheKey";

export const runtime = "nodejs";
export const maxDuration = 45;

type CompilerEngine = "pdflatex" | "xelatex" | "lualatex";

// Fast in-memory binary cache for compiled LaTeX PDFs (instant recompile on identical .tex)
const pdfBinaryCache = new Map<string, { pdf: Uint8Array; ts: number }>();
const MAX_CACHED_PDFS = 40;
const PDF_CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

function cacheCompiledPdf(key: string, pdf: Uint8Array) {
  if (pdfBinaryCache.size >= MAX_CACHED_PDFS) {
    const oldestKey = pdfBinaryCache.keys().next().value;
    if (oldestKey) pdfBinaryCache.delete(oldestKey);
  }
  pdfBinaryCache.set(key, { pdf, ts: Date.now() });
}

function isPdfBinary(bytes: Uint8Array): boolean {
  // Valid PDF files start with %PDF-
  return (
    bytes.length > 100 &&
    bytes[0] === 0x25 && // %
    bytes[1] === 0x50 && // P
    bytes[2] === 0x44 && // D
    bytes[3] === 0x46 && // F
    bytes[4] === 0x2d    // -
  );
}

function extractLatexError(rawLog: string): {
  summary: string;
  line: number | null;
  excerpt: string;
} {
  const lines = rawLog.split(/\r?\n/);
  let summary = "LaTeX compilation failed. Check syntax near braces or special characters (%, &, $, _, #).";
  let lineNum: number | null = null;

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (l.startsWith("! ")) {
      summary = l.slice(2).trim();
      // Scan next few lines for `l.<number>` line number indicator
      for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
        const match = /^l\.(\d+)\s*(.*)$/.exec(lines[j].trim());
        if (match) {
          lineNum = parseInt(match[1], 10);
          if (match[2]) {
            summary += ` (near "${match[2].trim().slice(0, 60)}")`;
          }
          break;
        }
      }
      break;
    }
  }

  // Also check file:line:error style if standard `! ` wasn't matched cleanly
  if (lineNum === null) {
    for (const raw of lines) {
      const flMatch = /:(\d+):\s*(.+)$/.exec(raw);
      if (flMatch) {
        lineNum = parseInt(flMatch[1], 10);
        if (summary.startsWith("LaTeX compilation failed")) {
          summary = flMatch[2].trim();
        }
        break;
      }
    }
  }

  // Produce readable trailing excerpt around errors
  const tailLines = lines.slice(-60).join("\n");
  return {
    summary,
    line: lineNum,
    excerpt: tailLines || rawLog.slice(-3000),
  };
}

function makePdfResponse(pdfBytes: Uint8Array, compiler: string, backend: string, cacheStatus: "HIT" | "MISS") {
  const arrayBuffer = pdfBytes.buffer.slice(
    pdfBytes.byteOffset,
    pdfBytes.byteOffset + pdfBytes.byteLength
  ) as ArrayBuffer;

  return new Response(arrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="resume.pdf"',
      "Cache-Control": "no-store",
      "X-Latex-Compiler": compiler,
      "X-Latex-Backend": backend,
      "X-Cache": cacheStatus,
    },
  });
}

async function compileViaYtotech(tex: string, compiler: CompilerEngine) {
  const res = await fetch("https://latex.ytotech.com/builds/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      compiler,
      resources: [
        {
          main: true,
          content: tex,
        },
      ],
    }),
    signal: AbortSignal.timeout(28000),
  });

  const arrayBuf = await res.arrayBuffer();
  const bytes = new Uint8Array(arrayBuf);

  if (isPdfBinary(bytes)) {
    return { ok: true as const, pdf: bytes };
  }

  const textBody = new TextDecoder().decode(bytes);
  try {
    const jsonErr = JSON.parse(textBody);
    const logsMap = jsonErr?.log_files || {};
    const firstLogKey = Object.keys(logsMap)[0];
    const logContent = firstLogKey ? String(logsMap[firstLogKey]) : textBody;

    // Only treat as deterministic user LaTeX syntax error when compiler reports compilation error
    const isSyntaxFailure =
      jsonErr?.error === "COMPILATION_ERROR" ||
      res.status === 400 ||
      res.status === 422 ||
      logContent.includes("!");

    return {
      ok: false as const,
      isSyntaxError: isSyntaxFailure,
      rawLog: logContent,
      status: res.status,
    };
  } catch {
    return {
      ok: false as const,
      isSyntaxError: false,
      rawLog: textBody,
      status: res.status,
    };
  }
}

async function compileViaTexLiveNet(tex: string, compiler: CompilerEngine) {
  const formData = new FormData();
  formData.append("filecontents[]", tex);
  formData.append("filename[]", "document.tex");
  formData.append("engine", compiler);
  formData.append("return", "pdf");

  const res = await fetch("https://texlive.net/cgi-bin/latexcgi", {
    method: "POST",
    body: formData,
    redirect: "follow",
    signal: AbortSignal.timeout(28000),
  });

  const arrayBuf = await res.arrayBuffer();
  const bytes = new Uint8Array(arrayBuf);

  if (isPdfBinary(bytes)) {
    return { ok: true as const, pdf: bytes };
  }

  const logText = new TextDecoder().decode(bytes);
  return {
    ok: false as const,
    isSyntaxError: logText.includes("This is pdfTeX") || logText.includes("! "),
    rawLog: logText,
    status: res.status,
  };
}

export async function POST(req: NextRequest) {
  try {
    const user = await verifyRequestUser(req);
    const rateLimitResponse = applyRateLimit(req, {
      bucket: "compile-latex",
      identityKey: user?.uid,
      limit: user ? 60 : 25,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const tex = typeof body?.tex === "string" ? body.tex : "";
    const requestedCompiler = body?.compiler;
    const compiler: CompilerEngine =
      requestedCompiler === "xelatex" || requestedCompiler === "lualatex"
        ? requestedCompiler
        : "pdflatex";

    if (!tex.trim()) {
      return NextResponse.json({ error: "Missing LaTeX source code" }, { status: 400 });
    }

    if (tex.length > 150000) {
      return NextResponse.json({ error: "LaTeX source exceeds maximum 150KB limit" }, { status: 400 });
    }

    // Reject shell escape / filesystem probe primitives
    if (/\\write18|\\immediate\s*\\write|\\open(in|out)|\\input\s*\{\s*\//i.test(tex)) {
      return NextResponse.json(
        { error: "Restricted TeX command detected (\\write18 / filesystem path not allowed)." },
        { status: 400 }
      );
    }

    // Check binary SHA-256 cache
    const cacheKey = generateCacheKey(`${compiler}:${tex}`);
    const cached = pdfBinaryCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < PDF_CACHE_TTL_MS) {
      return makePdfResponse(cached.pdf, compiler, "memory-cache", "HIT");
    }

    // Tier 1: latex.ytotech.com
    try {
      const tier1 = await compileViaYtotech(tex, compiler);
      if (tier1.ok) {
        cacheCompiledPdf(cacheKey, tier1.pdf);
        return makePdfResponse(tier1.pdf, compiler, "cloud-primary", "MISS");
      }

      if (tier1.isSyntaxError) {
        const parsedErr = extractLatexError(tier1.rawLog);
        return NextResponse.json(
          {
            error: parsedErr.summary,
            line: parsedErr.line,
            log: parsedErr.excerpt,
          },
          { status: 422 }
        );
      }
      console.warn("[compile-latex] Tier 1 (ytotech) unavailable status:", tier1.status);
    } catch (err) {
      console.warn("[compile-latex] Tier 1 (ytotech) network error, failing over:", err);
    }

    // Tier 2 Fallback: texlive.net CGI
    try {
      const tier2 = await compileViaTexLiveNet(tex, compiler);
      if (tier2.ok) {
        cacheCompiledPdf(cacheKey, tier2.pdf);
        return makePdfResponse(tier2.pdf, compiler, "cloud-fallback", "MISS");
      }

      if (tier2.isSyntaxError) {
        const parsedErr = extractLatexError(tier2.rawLog);
        return NextResponse.json(
          {
            error: parsedErr.summary,
            line: parsedErr.line,
            log: parsedErr.excerpt,
          },
          { status: 422 }
        );
      }
    } catch (err) {
      console.error("[compile-latex] Tier 2 (texlive.net) error:", err);
    }

    return NextResponse.json(
      {
        error: "LaTeX compiler cloud services are temporarily busy. Please try compiling again in a few seconds.",
      },
      { status: 503 }
    );
  } catch (error) {
    console.error("[compile-latex] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to process LaTeX compilation request." },
      { status: 500 }
    );
  }
}
