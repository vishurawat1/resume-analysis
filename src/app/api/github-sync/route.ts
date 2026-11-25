import { NextRequest, NextResponse } from "next/server";
import { authorizeMeteredRequest, buildQuotaHeaders } from "@/lib/usageMeter";
import { escapeLatex } from "@/lib/latexTemplates";
import { generateAIResponseWithMeta } from "@/services/aiService";

export const runtime = "nodejs";
export const maxDuration = 45;

const GITHUB_USERNAME_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

interface GithubUserApi {
  login: string;
  name: string | null;
  bio: string | null;
  avatar_url: string;
  public_repos: number;
  followers: number;
  html_url: string;
}

interface GithubRepoApi {
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  topics?: string[];
  updated_at: string;
  pushed_at?: string;
  fork: boolean;
}

interface RankedRepo {
  name: string;
  description: string;
  htmlUrl: string;
  language: string;
  stars: number;
  forks: number;
  topics: string[];
  updatedAt: string;
}

function extractGithubUsername(rawInput: string): string | null {
  const trimmed = rawInput.trim().replace(/^@+/, "");
  if (!trimmed || trimmed.length > 300) return null;

  let candidate = trimmed;
  if (/^https?:\/\//i.test(trimmed) || /^(?:www\.)?github\.com\//i.test(trimmed)) {
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
      const parsed = new URL(withProto);
      const host = parsed.hostname.toLowerCase();
      if (host !== "github.com" && host !== "www.github.com") {
        return null;
      }
      const firstSegment = parsed.pathname.split("/").filter(Boolean)[0] || "";
      candidate = firstSegment;
    } catch {
      return null;
    }
  }

  candidate = candidate.replace(/\/+$/, "");
  if (!GITHUB_USERNAME_REGEX.test(candidate)) {
    return null;
  }
  return candidate;
}

function normalizeForPdflatex(text?: string): string {
  if (!text) return "";
  return text
    .replace(/[\u2192\u2794]/g, "->")
    .replace(/\u2190/g, "<-")
    .replace(/\u2265/g, ">=")
    .replace(/\u2264/g, "<=")
    .replace(/\u00d7/g, "x")
    .replace(/[\u2022\u00b7]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\uFE00-\uFE0F\u200D]/gu, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

function safeLatex(text?: string): string {
  const noMarkdownBold = (text || "").replace(/\*\*([\s\S]*?)\*\*/g, "$1");
  return escapeLatex(normalizeForPdflatex(noMarkdownBold));
}

function stripBulletPrefix(text: string): string {
  return text.replace(/^[-•*–—\s]+/, "").trim();
}

function formatRepoDate(isoDate: string): string {
  const ts = Date.parse(isoDate);
  if (Number.isNaN(ts)) return "";
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function computeRepoScore(repo: GithubRepoApi): number {
  const stars = repo.stargazers_count || 0;
  const forks = repo.forks_count || 0;
  const dateStr = repo.pushed_at || repo.updated_at;
  const ts = Date.parse(dateStr);
  const ageDays = Number.isNaN(ts) ? 365 : Math.max(0, (Date.now() - ts) / 86_400_000);
  const recencyScore = Math.max(0, 30 - ageDays * 0.15);
  const starScore = stars * 3 + Math.log10(stars + 1) * 10;
  const forkScore = forks * 1.5;
  const metadataBonus =
    (repo.description ? 3 : 0) + (Array.isArray(repo.topics) && repo.topics.length > 0 ? 2 : 0);
  return starScore + forkScore + recencyScore + metadataBonus;
}

function buildFallbackXyzBullets(repo: RankedRepo, targetRole: string): string[] {
  const stackParts = [repo.language, ...repo.topics.slice(0, 3)].filter(Boolean);
  const stackStr = stackParts.length > 0 ? stackParts.join(", ") : "modular software architecture";
  const roleContext = targetRole ? ` aligned with ${targetRole} best practices` : "";
  const adoptionPhrase =
    repo.stars > 0
      ? `earning ${repo.stars} GitHub star${repo.stars === 1 ? "" : "s"}${repo.forks > 0 ? ` and ${repo.forks} fork${repo.forks === 1 ? "" : "s"}` : ""}`
      : "achieving reproducible local setup and clean modular separation";

  const purposeText = repo.description
    ? repo.description.replace(/\.$/, "")
    : `${repo.name} application workflows`;

  const bullet1 = `Engineered ${repo.name} using ${stackStr} to streamline ${purposeText}, ${adoptionPhrase}${roleContext}.`;
  const bullet2 = `Implemented automated validation, structured error handling, and documented APIs across ${repo.name} to cut integration friction and maintain reliable build quality.`;

  return [bullet1, bullet2];
}

function buildLatexSnippet(repo: RankedRepo, xyzBullets: string[]): string {
  const stackItems: string[] = [];
  const seen = new Set<string>();
  for (const raw of [repo.language, ...repo.topics.slice(0, 3)]) {
    const clean = raw.trim();
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      stackItems.push(clean);
    }
  }

  const escName = safeLatex(repo.name);
  const safeHref = /^https:\/\/github\.com\/[a-zA-Z0-9._/-]+$/.test(repo.htmlUrl)
    ? repo.htmlUrl
    : "";
  const nameMarkup = safeHref
    ? `\\href{${safeHref}}{\\textbf{${escName}}}`
    : `\\textbf{${escName}}`;

  const techMarkup =
    stackItems.length > 0 ? ` $|$ \\emph{${safeLatex(stackItems.join(", "))}}` : "";
  const dateMarkup = safeLatex(formatRepoDate(repo.updatedAt));

  const bulletLines = xyzBullets
    .slice(0, 2)
    .map((b) => `        \\resumeItem{${safeLatex(stripBulletPrefix(b))}}`);

  return [
    `    \\resumeProjectHeading`,
    `      {${nameMarkup}${techMarkup}}{${dateMarkup}}`,
    `      \\resumeItemListStart`,
    ...bulletLines,
    `      \\resumeItemListEnd`,
  ].join("\n");
}

function isRateLimitedGithubResponse(res: Response, bodyText?: string): boolean {
  if (res.status === 429) return true;
  if (res.status === 403) {
    const remaining = res.headers.get("x-ratelimit-remaining");
    if (remaining === "0") return true;
    if (bodyText && /rate limit/i.test(bodyText)) return true;
  }
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const authGate = await authorizeMeteredRequest(req, { bucket: "github-sync", cost: 1, rateLimit: 35 });
    if (!authGate.ok) return authGate.response;

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
    }

    if (!rawBody || typeof rawBody !== "object") {
      return NextResponse.json({ error: "Invalid payload format." }, { status: 400 });
    }

    const body = rawBody as Record<string, unknown>;
    const rawUsername = typeof body.username === "string" ? body.username : "";
    const username = extractGithubUsername(rawUsername);

    if (!username) {
      return NextResponse.json(
        {
          error:
            "Invalid GitHub username. Provide a valid handle (e.g. octocat) or https://github.com/<username> URL.",
        },
        { status: 400 }
      );
    }

    const targetRole =
      typeof body.targetRole === "string" ? body.targetRole.trim().slice(0, 150) : "";
    const parsedMaxRepos =
      typeof body.maxRepos === "number"
        ? body.maxRepos
        : typeof body.maxRepos === "string" && body.maxRepos.trim() !== ""
          ? Number(body.maxRepos)
          : 4;
    const maxRepos = Math.min(
      8,
      Math.max(1, Number.isFinite(parsedMaxRepos) ? Math.floor(parsedMaxRepos) : 4)
    );

    const ghHeaders: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "ai-resume-project-github-sync",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    if (process.env.GITHUB_TOKEN) {
      ghHeaders.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const encodedUser = encodeURIComponent(username);
    let userRes: Response;
    let reposRes: Response;

    try {
      [userRes, reposRes] = await Promise.all([
        fetch(`https://api.github.com/users/${encodedUser}`, {
          headers: ghHeaders,
          signal: AbortSignal.timeout(10000),
        }),
        fetch(`https://api.github.com/users/${encodedUser}/repos?sort=updated&per_page=8`, {
          headers: ghHeaders,
          signal: AbortSignal.timeout(10000),
        }),
      ]);
    } catch (err) {
      console.error("[github-sync] GitHub fetch failed:", err);
      return NextResponse.json(
        { error: "Failed to reach GitHub API. Please try again shortly." },
        { status: 502 }
      );
    }

    if (!userRes.ok) {
      const errText = await userRes.text().catch(() => "");
      if (isRateLimitedGithubResponse(userRes, errText)) {
        return NextResponse.json(
          { error: "GitHub API rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }
      if (userRes.status === 404) {
        return NextResponse.json(
          { error: `GitHub user "${username}" was not found.` },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: `GitHub API returned HTTP ${userRes.status}.` },
        { status: 502 }
      );
    }

    if (!reposRes.ok) {
      const errText = await reposRes.text().catch(() => "");
      if (isRateLimitedGithubResponse(reposRes, errText)) {
        return NextResponse.json(
          { error: "GitHub API rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }
      if (reposRes.status === 404) {
        return NextResponse.json(
          { error: `GitHub user "${username}" was not found.` },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: `GitHub repositories endpoint returned HTTP ${reposRes.status}.` },
        { status: 502 }
      );
    }

    const userJson = (await userRes.json()) as GithubUserApi;
    const reposJson = (await reposRes.json()) as GithubRepoApi[];

    const profile = {
      username: userJson.login || username,
      name: userJson.name || userJson.login || username,
      bio: userJson.bio || "",
      avatarUrl: userJson.avatar_url || "",
      publicRepos: Number(userJson.public_repos) || 0,
      followers: Number(userJson.followers) || 0,
      htmlUrl: userJson.html_url || `https://github.com/${username}`,
    };

    const nonForkRepos = Array.isArray(reposJson) ? reposJson.filter((r) => r && !r.fork) : [];
    const rankedRepos: RankedRepo[] = nonForkRepos
      .sort((a, b) => computeRepoScore(b) - computeRepoScore(a))
      .slice(0, maxRepos)
      .map((r) => ({
        name: r.name,
        description: r.description || "",
        htmlUrl: r.html_url,
        language: r.language || "",
        stars: Number(r.stargazers_count) || 0,
        forks: Number(r.forks_count) || 0,
        topics: Array.isArray(r.topics) ? r.topics.slice(0, 6) : [],
        updatedAt: r.updated_at || "",
      }));

    const aiBulletsMap = new Map<string, string[]>();
    let aiCached = false;

    if (rankedRepos.length > 0) {
      const repoSummaries = rankedRepos.map((r) => ({
        name: r.name,
        description: r.description || "No description provided",
        language: r.language || "Unspecified",
        topics: r.topics,
        stars: r.stars,
        forks: r.forks,
      }));

      const prompt = `
You are a Principal Software Engineering Resume Architect.
Generate 2 concise, ATS-ready, Google XYZ resume bullet points ("Accomplished [X] as measured by [Y] by doing [Z]") for EACH GitHub repository below.

${targetRole ? `TARGET ROLE: ${targetRole}` : ""}
REPOSITORIES:
${JSON.stringify(repoSummaries, null, 2)}

RULES:
1. Return EXACTLY 2 bullets per repository.
2. Start each bullet with a strong past-tense action verb (e.g., Engineered, Architected, Automated, Built, Optimized). Do NOT include leading "•" or "-" characters.
3. Ground bullets in the real language, topics, description, stars, and forks provided — do not invent fake enterprise revenue or unrelated employers.
4. Keep each bullet crisp (18-30 words) so it fits neatly on 1-2 lines in a LaTeX resume.

Return ONLY valid JSON matching this schema (no markdown fences):
{
  "repos": [
    {
      "name": "<exact repository name>",
      "xyzBullets": ["<Google XYZ bullet 1>", "<Google XYZ bullet 2>"]
    }
  ]
}
`;

      try {
        const aiMeta = await generateAIResponseWithMeta(prompt);
        aiCached = aiMeta.cached;
        const parsed = JSON.parse(aiMeta.text) as {
          repos?: Array<{ name?: unknown; xyzBullets?: unknown }>;
        };
        if (Array.isArray(parsed?.repos)) {
          for (const item of parsed.repos) {
            if (!item || typeof item.name !== "string" || !Array.isArray(item.xyzBullets)) continue;
            const cleanBullets = item.xyzBullets
              .filter((b): b is string => typeof b === "string" && b.trim().length > 0)
              .map((b) => stripBulletPrefix(b))
              .slice(0, 2);
            if (cleanBullets.length > 0) {
              aiBulletsMap.set(item.name.toLowerCase(), cleanBullets);
            }
          }
        }
      } catch (aiErr) {
        console.warn("[github-sync] AI bullet generation fallback triggered:", aiErr);
      }
    }

    const repos = rankedRepos.map((repo) => {
      const fallbackBullets = buildFallbackXyzBullets(repo, targetRole);
      const aiBullets = aiBulletsMap.get(repo.name.toLowerCase()) || [];
      const xyzBullets = [
        aiBullets[0] || fallbackBullets[0],
        aiBullets[1] || fallbackBullets[1],
      ];
      const latexSnippet = buildLatexSnippet(repo, xyzBullets);

      return {
        ...repo,
        xyzBullets,
        latexSnippet,
      };
    });

    const nextQuota = await authGate.consume(rankedRepos.length === 0 || aiCached ? 0 : 1);
    return NextResponse.json(
      {
        profile,
        repos,
      },
      { headers: buildQuotaHeaders(nextQuota) }
    );
  } catch (error) {
    console.error("[github-sync] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to sync GitHub repositories." },
      { status: 500 }
    );
  }
}
