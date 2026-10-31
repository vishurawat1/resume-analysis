import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resiliently replaces a substring within a resume text.
 * Handles exact matches, trimmed matches, and flexible whitespace/newline variations
 * to ensure AI-suggested bullet point replacements always succeed in the editor/export draft.
 */
export function replaceResumeSubstring(source: string, original: string, improved: string): string {
  if (!source || !original) return source;

  // 1. Direct exact match
  if (source.includes(original)) {
    return source.replace(original, improved);
  }

  // 2. Trimmed match
  const trimmedOrig = original.trim();
  if (source.includes(trimmedOrig)) {
    return source.replace(trimmedOrig, improved);
  }

  // 3. Flexible whitespace & newline regex match
  try {
    const escaped = trimmedOrig
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\s+/g, "\\s+");
    const regex = new RegExp(escaped);
    if (regex.test(source)) {
      return source.replace(regex, improved);
    }
  } catch {
    // If regex compilation fails, proceed to fallback
  }

  // 4. Case-insensitive flexible whitespace match
  try {
    const escapedCi = trimmedOrig
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\s+/g, "\\s+");
    const regexCi = new RegExp(escapedCi, "i");
    if (regexCi.test(source)) {
      return source.replace(regexCi, improved);
    }
  } catch {
    // Fallback
  }

  return source;
}
