import { NextRequest, NextResponse } from "next/server";
import dns from "node:dns/promises";
import net from "node:net";
import { applyRateLimit } from "@/lib/rate-limit";
import { generateAIResponse } from "@/services/aiService";

export const runtime = "nodejs";
export const maxDuration = 45;

const MAX_URL_LENGTH = 2048;
const FETCH_TIMEOUT_MS = 12000;
const MAX_REDIRECTS = 5;
const MAX_HTML_BYTES = 1_500_000;
const MAX_EXTRACTED_TEXT = 12000;
const MIN_EXTRACTED_TEXT = 80;

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
};

interface ExtractedJobPayload {
  jobTitle: string;
  company: string;
  location: string;
  jobDescription: string;
}

function isBlockedIpv4(ip: string): boolean {
  const parts = ip.split(".").map((n) => Number(n));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0) return true; // 0.0.0.0/8 ("this network")
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local / cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
  if (a >= 224) return true; // multicast / reserved
  return false;
}

function extractMappedIpv4FromIpv6(cleanIp: string): string | null {
  const lower = cleanIp.toLowerCase();
  let suffix = "";
  if (lower.startsWith("::ffff:")) {
    suffix = lower.slice(7);
  } else if (lower.startsWith("::") && !lower.slice(2).includes("::")) {
    // Also catch IPv4-compatible IPv6 such as ::127.0.0.1 (::7f00:1) or ::a9fe:a9fe
    suffix = lower.slice(2);
  } else {
    return null;
  }

  if (net.isIPv4(suffix)) return suffix;

  const hexParts = suffix.split(":");
  if (hexParts.length === 2 && hexParts.every((p) => /^[0-9a-f]{1,4}$/.test(p))) {
    const hi = parseInt(hexParts[0], 16);
    const lo = parseInt(hexParts[1], 16);
    if (!Number.isNaN(hi) && !Number.isNaN(lo) && hi <= 0xffff && lo <= 0xffff) {
      return `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
    }
  }
  return null;
}

function isBlockedIp(rawIp: string): boolean {
  const ip = rawIp.replace(/^\[|\]$/g, "").split("%")[0].toLowerCase();
  const family = net.isIP(ip);
  if (family === 4) {
    return isBlockedIpv4(ip);
  }
  if (family === 6) {
    if (ip === "::1" || ip === "::" || ip === "0:0:0:0:0:0:0:1" || ip === "0:0:0:0:0:0:0:0") {
      return true;
    }
    const mappedV4 = extractMappedIpv4FromIpv6(ip);
    if (mappedV4) {
      return isBlockedIpv4(mappedV4);
    }
    // Unique local fc00::/7 (fc.. or fd..) and link-local fe80::/10 (fe80..febf)
    if (ip.startsWith("fc") || ip.startsWith("fd")) return true;
    if (/^fe[89ab][0-9a-f]/i.test(ip)) return true;
    return false;
  }
  return true;
}

function isBlockedHostname(rawHostname: string): boolean {
  const host = rawHostname.replace(/^\[|\]$/g, "").replace(/\.+$/, "").toLowerCase();
  if (!host) return true;

  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    return true;
  }

  if (net.isIP(host) !== 0) {
    return isBlockedIp(host);
  }

  return false;
}

async function validateTargetUrl(rawUrl: string): Promise<{ ok: true; url: URL } | { ok: false; status: number; error: string }> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return {
      ok: false,
      status: 400,
      error: "Please enter a valid http:// or https:// job posting URL.",
    };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      ok: false,
      status: 400,
      error: "Only http:// and https:// URLs are supported.",
    };
  }

  if (parsed.username || parsed.password) {
    return {
      ok: false,
      status: 400,
      error: "URLs with embedded credentials are not allowed.",
    };
  }

  if (isBlockedHostname(parsed.hostname)) {
    return {
      ok: false,
      status: 400,
      error: "Blocked private, loopback, or local network target URL.",
    };
  }

  const cleanHost = parsed.hostname.replace(/^\[|\]$/g, "");
  if (net.isIP(cleanHost) === 0) {
    try {
      const records = await dns.lookup(cleanHost, { all: true });
      if (!records || records.length === 0) {
        return {
          ok: false,
          status: 502,
          error: `Could not resolve hostname "${parsed.hostname}". Please verify the URL.`,
        };
      }
      for (const rec of records) {
        if (isBlockedIp(rec.address)) {
          return {
            ok: false,
            status: 400,
            error: "Target domain resolves to a private or local IP address.",
          };
        }
      }
    } catch {
      return {
        ok: false,
        status: 502,
        error: `Could not reach hostname "${parsed.hostname}". Check the URL or paste the job description directly.`,
      };
    }
  }

  return { ok: true, url: parsed };
}

function decodeHtmlEntities(input: string): string {
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    ndash: "-",
    mdash: "-",
    bull: "•",
    rsquo: "'",
    lsquo: "'",
    rdquo: '"',
    ldquo: '"',
  };

  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (full, entity: string) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      const code = parseInt(entity.slice(2), 16);
      return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : full;
    }
    if (entity.startsWith("#")) {
      const code = parseInt(entity.slice(1), 10);
      return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : full;
    }
    return named[entity.toLowerCase()] ?? full;
  });
}

function extractHtmlSignals(html: string): {
  title: string;
  siteName: string;
  jsonLdJob: Partial<ExtractedJobPayload>;
} {
  const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  const title = titleMatch ? decodeHtmlEntities(titleMatch[1].replace(/\s+/g, " ").trim()) : "";

  const siteMatch =
    /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i.exec(html) ||
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:site_name["']/i.exec(html);
  const siteName = siteMatch ? decodeHtmlEntities(siteMatch[1].trim()) : "";

  const jsonLdJob: Partial<ExtractedJobPayload> = {};
  const ldRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = ldRegex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      const candidates = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.["@graph"])
          ? parsed["@graph"]
          : [parsed];
      for (const item of candidates) {
        if (!item || typeof item !== "object") continue;
        const typeVal = item["@type"];
        const isJob =
          typeVal === "JobPosting" ||
          (Array.isArray(typeVal) && typeVal.includes("JobPosting"));
        if (!isJob) continue;

        if (typeof item.title === "string" && !jsonLdJob.jobTitle) {
          jsonLdJob.jobTitle = decodeHtmlEntities(item.title.trim());
        }
        if (typeof item.hiringOrganization?.name === "string" && !jsonLdJob.company) {
          jsonLdJob.company = decodeHtmlEntities(item.hiringOrganization.name.trim());
        }
        const loc = Array.isArray(item.jobLocation) ? item.jobLocation[0] : item.jobLocation;
        const addr = loc?.address;
        if (addr && typeof addr === "object" && !jsonLdJob.location) {
          const locParts = [addr.addressLocality, addr.addressRegion, addr.addressCountry]
            .filter((x) => typeof x === "string" && x.trim().length > 0)
            .map((x: string) => x.trim());
          if (locParts.length > 0) {
            jsonLdJob.location = locParts.join(", ");
          }
        } else if (typeof item.jobLocationType === "string" && item.jobLocationType.includes("TELECOMMUTE")) {
          jsonLdJob.location = "Remote";
        }
        if (typeof item.description === "string" && !jsonLdJob.jobDescription) {
          jsonLdJob.jobDescription = stripHtmlToText(item.description).slice(0, MAX_EXTRACTED_TEXT);
        }
      }
    } catch {
      // Ignore malformed JSON-LD blocks
    }
  }

  return { title, siteName, jsonLdJob };
}

function stripHtmlToText(html: string): string {
  const withoutNoise = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ")
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, " ")
    .replace(/<select\b[^>]*>[\s\S]*?<\/select>/gi, " ")
    .replace(/<template\b[^>]*>[\s\S]*?<\/template>/gi, " ");

  const withLineBreaks = withoutNoise
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|section|article|header|li|tr|h1|h2|h3|h4|h5|h6|blockquote)>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "\n• ");

  const withoutTags = withLineBreaks.replace(/<[^>]+>/g, " ");
  const decoded = decodeHtmlEntities(withoutTags);

  return decoded
    .replace(/\r/g, "")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function readResponseTextWithLimit(res: Response, maxBytes: number): Promise<string> {
  if (!res.body) {
    const text = await res.text();
    return text.slice(0, maxBytes);
  }
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      const remaining = maxBytes - total;
      if (remaining <= 0) {
        await reader.cancel().catch(() => {});
        break;
      }
      if (value.byteLength > remaining) {
        chunks.push(value.subarray(0, remaining));
        total += remaining;
        await reader.cancel().catch(() => {});
        break;
      }
      chunks.push(value);
      total += value.byteLength;
    }
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(merged);
}

function inferTitleParts(rawTitle: string, sourceHost: string): { jobTitle: string; company: string } {
  if (!rawTitle) {
    return { jobTitle: "", company: sourceHost.replace(/^www\./, "") };
  }
  const parts = rawTitle.split(/\s+[|\-–—@]\s+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return {
      jobTitle: parts[0].slice(0, 120),
      company: parts[1].slice(0, 100),
    };
  }
  return {
    jobTitle: rawTitle.slice(0, 120),
    company: sourceHost.replace(/^www\./, ""),
  };
}

export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = applyRateLimit(req);
    if (rateLimitResponse) return rateLimitResponse;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
    }

    const rawUrl =
      body && typeof body === "object" && "url" in body && typeof (body as { url: unknown }).url === "string"
        ? (body as { url: string }).url.trim()
        : "";

    if (!rawUrl) {
      return NextResponse.json({ error: "Missing job posting URL." }, { status: 400 });
    }
    if (rawUrl.length > MAX_URL_LENGTH) {
      return NextResponse.json({ error: "Job URL exceeds maximum allowed length." }, { status: 400 });
    }

    const initialCheck = await validateTargetUrl(rawUrl);
    if (!initialCheck.ok) {
      return NextResponse.json({ error: initialCheck.error }, { status: initialCheck.status });
    }

    const deadline = Date.now() + FETCH_TIMEOUT_MS;
    let currentUrl = initialCheck.url;
    let response: Response | null = null;

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const remainingMs = deadline - Date.now();
      if (remainingMs <= 200) {
        return NextResponse.json(
          { error: "Timed out while fetching the job posting URL. Please paste the job description directly." },
          { status: 502 }
        );
      }

      let res: Response;
      try {
        res = await fetch(currentUrl.toString(), {
          method: "GET",
          headers: BROWSER_HEADERS,
          redirect: "manual",
          signal: AbortSignal.timeout(remainingMs),
        });
      } catch (fetchErr: unknown) {
        const isTimeout =
          fetchErr instanceof Error &&
          (fetchErr.name === "TimeoutError" || fetchErr.name === "AbortError");
        return NextResponse.json(
          {
            error: isTimeout
              ? "Timed out waiting for the job posting page (12s limit). Please paste the job description directly."
              : "Could not connect to the job posting URL. Please verify the link or paste the job description directly.",
          },
          { status: 502 }
        );
      }

      if (res.status >= 300 && res.status < 400) {
        const locationHeader = res.headers.get("location");
        if (!locationHeader) {
          return NextResponse.json(
            { error: "Job URL returned an invalid redirect." },
            { status: 502 }
          );
        }
        if (hop === MAX_REDIRECTS) {
          return NextResponse.json(
            { error: "Job URL redirected too many times." },
            { status: 502 }
          );
        }

        let resolvedRedirect: string;
        try {
          resolvedRedirect = new URL(locationHeader, currentUrl).toString();
        } catch {
          return NextResponse.json({ error: "Invalid redirect URL." }, { status: 502 });
        }

        const redirectCheck = await validateTargetUrl(resolvedRedirect);
        if (!redirectCheck.ok) {
          return NextResponse.json({ error: redirectCheck.error }, { status: redirectCheck.status });
        }
        currentUrl = redirectCheck.url;
        continue;
      }

      response = res;
      break;
    }

    if (!response) {
      return NextResponse.json({ error: "Failed to fetch job posting URL." }, { status: 502 });
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Target website returned HTTP ${response.status}. Some job boards block automated scraping — please copy and paste the job description directly.`,
        },
        { status: 502 }
      );
    }

    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    const isLikelyHtml =
      contentType.includes("text/html") ||
      contentType.includes("application/xhtml+xml") ||
      contentType === "";

    if (!isLikelyHtml) {
      return NextResponse.json(
        {
          error: `Expected an HTML job page, but received "${contentType || "unknown"}". Please paste the job description text directly.`,
        },
        { status: 422 }
      );
    }

    const html = await readResponseTextWithLimit(response, MAX_HTML_BYTES);

    if (contentType === "" && !/<(?:!doctype|html|head|body|div|p|article|main)\b/i.test(html.slice(0, 4096))) {
      return NextResponse.json(
        { error: "The target URL did not return readable HTML content." },
        { status: 422 }
      );
    }

    const signals = extractHtmlSignals(html);
    const cleanedBody = stripHtmlToText(html);
    const combinedText = [
      signals.title ? `Page Title: ${signals.title}` : "",
      signals.siteName ? `Site Name: ${signals.siteName}` : "",
      signals.jsonLdJob.jobTitle ? `Structured Job Title: ${signals.jsonLdJob.jobTitle}` : "",
      signals.jsonLdJob.company ? `Structured Company: ${signals.jsonLdJob.company}` : "",
      signals.jsonLdJob.location ? `Structured Location: ${signals.jsonLdJob.location}` : "",
      "",
      cleanedBody,
    ]
      .filter(Boolean)
      .join("\n")
      .slice(0, MAX_EXTRACTED_TEXT);

    if (cleanedBody.length < MIN_EXTRACTED_TEXT && !signals.jsonLdJob.jobDescription) {
      return NextResponse.json(
        {
          error:
            "Could not extract enough readable text from that page (it may require JavaScript rendering or login). Please paste the job description directly.",
        },
        { status: 422 }
      );
    }

    const sourceHost = currentUrl.hostname;
    const prompt = `
You are a precise Job Posting Parser.
Extract the structured job details from the scraped web page text below.

SOURCE HOST: ${sourceHost}

RULES:
1. Extract "jobTitle", "company", "location", and "jobDescription".
2. Remove website navigation menus, cookie banners, footer links, legal boilerplate, and "Apply Now" button noise from "jobDescription".
3. Preserve key responsibilities, required qualifications, preferred skills, tech stack, and compensation/location details cleanly with readable line breaks.
4. Keep "jobDescription" concise and well-structured (under 10,000 characters).
5. If a field is not present, return an empty string "".

SCRAPED PAGE TEXT:
"""
${combinedText}
"""

Return ONLY valid JSON matching this exact schema (no markdown code fences):
{
  "jobTitle": "<role title or empty string>",
  "company": "<company name or empty string>",
  "location": "<city/state or Remote/Hybrid or empty string>",
  "jobDescription": "<clean extracted job description text>"
}
`;

    let extracted: Partial<ExtractedJobPayload> = {};
    try {
      const aiRaw = await generateAIResponse(prompt);
      const parsed = JSON.parse(aiRaw);
      if (parsed && typeof parsed === "object") {
        extracted = parsed as Partial<ExtractedJobPayload>;
      }
    } catch (aiErr) {
      console.warn("[fetch-job] AI extraction fallback triggered:", aiErr);
    }

    const inferred = inferTitleParts(signals.title, sourceHost);
    const jobTitle =
      (typeof extracted.jobTitle === "string" && extracted.jobTitle.trim()) ||
      signals.jsonLdJob.jobTitle ||
      inferred.jobTitle;
    const company =
      (typeof extracted.company === "string" && extracted.company.trim()) ||
      signals.jsonLdJob.company ||
      signals.siteName ||
      inferred.company;
    const location =
      (typeof extracted.location === "string" && extracted.location.trim()) ||
      signals.jsonLdJob.location ||
      "";
    const jobDescription =
      (typeof extracted.jobDescription === "string" && extracted.jobDescription.trim()) ||
      signals.jsonLdJob.jobDescription ||
      cleanedBody.slice(0, 8000);

    if (!jobDescription || jobDescription.length < 40) {
      return NextResponse.json(
        {
          error:
            "No readable job description could be extracted from this page. Please paste the job description manually.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      jobTitle: jobTitle.slice(0, 200),
      company: company.slice(0, 200),
      location: location.slice(0, 200),
      jobDescription: jobDescription.slice(0, 12000),
      sourceHost,
    });
  } catch (error) {
    console.error("[fetch-job] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to fetch and parse the job posting URL." },
      { status: 500 }
    );
  }
}
