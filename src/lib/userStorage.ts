/**
 * Account-isolated client storage helpers.
 *
 * Prevents resume text, job descriptions, ATS analysis results, recent scan
 * history, LaTeX drafts, and personal preferences in sessionStorage/localStorage
 * from leaking when switching between Firebase accounts in the same browser.
 */

export type UserPrefKey =
  | "userHomeLocation"
  | "userWorkPreference"
  | "userGithubUsername"
  | "userTargetTrack"
  | "userPreferredLatexTemplate";

export const SESSION_OWNER_UID_KEY = "activeSessionOwnerUid";
export const LOCAL_OWNER_UID_KEY = "activeLocalOwnerUid";

const USER_SESSION_KEYS = [
  "resumeText",
  "jobDescription",
  "fileName",
  "jobTitle",
  "company",
  "location",
  "aiResult",
  "analyzedResumeText",
  "analyzedJobDesc",
  "uploadedPdfDataUrl",
  "resumeLatexSource",
  "coverLetterLatexSource",
  "resumeLatexTemplate",
  "resumeStructuredData",
  "pendingLatexBullet",
  "pendingLatexSource",
  "pendingLatexMode",
  "userHomeLocation",
  "userWorkPreference",
  "userGithubUsername",
  "userTargetTrack",
  "userPreferredLatexTemplate",
] as const;

const LEGACY_UNSCOPED_LOCAL_KEYS = [
  "recentScansHistory",
  "userHomeLocation",
  "userWorkPreference",
  "userGithubUsername",
  "userTargetTrack",
  "userPreferredLatexTemplate",
] as const;

/** Removes all per-user workspace keys and Career Kit caches from sessionStorage. */
export function clearWorkspaceSessionStorage(): void {
  if (typeof window === "undefined") return;
  try {
    for (const key of USER_SESSION_KEYS) {
      sessionStorage.removeItem(key);
    }
    const prefixedKeys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && (k.startsWith("career_kit_") || k.startsWith("careerKitCache:"))) {
        prefixedKeys.push(k);
      }
    }
    for (const k of prefixedKeys) {
      sessionStorage.removeItem(k);
    }
    sessionStorage.removeItem(SESSION_OWNER_UID_KEY);
  } catch {
    // Ignore storage access errors in restricted contexts
  }
}

/** Purges legacy unscoped keys from localStorage so another account cannot inherit them. */
export function purgeLegacyUnscopedLocalStorage(): void {
  if (typeof window === "undefined") return;
  try {
    for (const key of LEGACY_UNSCOPED_LOCAL_KEYS) {
      localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage access errors
  }
}

/**
 * Synchronizes browser storage isolation with the current Firebase auth UID.
 * Must run on auth resolution and sign-out before dashboard views hydrate.
 */
export function syncAuthSessionIsolation(nextUid: string | null): void {
  if (typeof window === "undefined") return;
  purgeLegacyUnscopedLocalStorage();

  try {
    const prevSessionUid = sessionStorage.getItem(SESSION_OWNER_UID_KEY);
    const prevLocalUid = localStorage.getItem(LOCAL_OWNER_UID_KEY);

    if (!nextUid) {
      clearWorkspaceSessionStorage();
      localStorage.removeItem(LOCAL_OWNER_UID_KEY);
      return;
    }

    if (prevSessionUid !== nextUid || prevLocalUid !== nextUid) {
      clearWorkspaceSessionStorage();
    }

    sessionStorage.setItem(SESSION_OWNER_UID_KEY, nextUid);
    localStorage.setItem(LOCAL_OWNER_UID_KEY, nextUid);
  } catch {
    // Ignore storage access errors
  }
}

/** Resolves the authenticated UID owning current session storage. */
export function getActiveStorageUid(explicitUid?: string | null): string | null {
  if (explicitUid && explicitUid.trim()) return explicitUid.trim();
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(SESSION_OWNER_UID_KEY);
  } catch {
    return null;
  }
}

function makeScopedLocalKey(baseKey: string, explicitUid?: string | null): string | null {
  const uid = getActiveStorageUid(explicitUid);
  return uid ? `u:${uid}:${baseKey}` : null;
}

/** Reads a UID-scoped item from localStorage (never falls back to unscoped keys). */
export function getUserLocalItem(baseKey: string, explicitUid?: string | null): string | null {
  if (typeof window === "undefined") return null;
  const scopedKey = makeScopedLocalKey(baseKey, explicitUid);
  if (!scopedKey) return null;
  try {
    return localStorage.getItem(scopedKey);
  } catch {
    return null;
  }
}

/** Writes a UID-scoped item to localStorage when an authenticated UID is active. */
export function setUserLocalItem(
  baseKey: string,
  value: string,
  explicitUid?: string | null
): void {
  if (typeof window === "undefined") return;
  const scopedKey = makeScopedLocalKey(baseKey, explicitUid);
  if (!scopedKey) return;
  try {
    localStorage.setItem(scopedKey, value);
  } catch {
    // Ignore quota / storage errors
  }
}

/** Removes a UID-scoped item from localStorage. */
export function removeUserLocalItem(baseKey: string, explicitUid?: string | null): void {
  if (typeof window === "undefined") return;
  const scopedKey = makeScopedLocalKey(baseKey, explicitUid);
  if (!scopedKey) return;
  try {
    localStorage.removeItem(scopedKey);
  } catch {
    // Ignore storage errors
  }
}

/** Reads a user preference scoped strictly to the active authenticated user. */
export function getUserPref(key: UserPrefKey, explicitUid?: string | null): string {
  const fromScopedLocal = getUserLocalItem(key, explicitUid);
  if (fromScopedLocal !== null) return fromScopedLocal;
  if (typeof window === "undefined") return "";
  try {
    // Only trust sessionStorage when it belongs to the active UID
    const owner = sessionStorage.getItem(SESSION_OWNER_UID_KEY);
    const uid = getActiveStorageUid(explicitUid);
    if (!uid || owner !== uid) return "";
    return sessionStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

/** Persists a user preference scoped strictly to the active authenticated user. */
export function setUserPref(
  key: UserPrefKey,
  value: string,
  explicitUid?: string | null
): void {
  if (typeof window === "undefined") return;
  const trimmed = value.trim();
  if (trimmed) {
    setUserLocalItem(key, trimmed, explicitUid);
  } else {
    removeUserLocalItem(key, explicitUid);
  }
  try {
    const owner = sessionStorage.getItem(SESSION_OWNER_UID_KEY);
    const uid = getActiveStorageUid(explicitUid);
    if (uid && owner === uid) {
      if (trimmed) {
        sessionStorage.setItem(key, trimmed);
      } else {
        sessionStorage.removeItem(key);
      }
    }
  } catch {
    // Ignore storage errors
  }
}
