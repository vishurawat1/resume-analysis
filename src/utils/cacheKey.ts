import CryptoJS from "crypto-js";

/**
 * Generates a SHA-256 hash from a given string (e.g. a prompt) to be used as a cache key.
 * @param prompt The full prompt string sent to the AI
 * @returns A unique SHA-256 string
 */
export function generateCacheKey(prompt: string): string {
  return CryptoJS.SHA256(prompt).toString(CryptoJS.enc.Hex);
}