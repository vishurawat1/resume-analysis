import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

// High-speed in-memory cache for serverless execution contexts (sub-millisecond instant hit)
const memoryCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

/**
 * Retrieves a cached AI response from either server in-memory cache or Firestore
 */
export async function getCachedResponse(cacheKey: string): Promise<string | null> {
  // 1. Check fast in-memory cache
  const memEntry = memoryCache.get(cacheKey);
  if (memEntry && Date.now() - memEntry.timestamp < CACHE_TTL_MS) {
    console.log(`[CacheService] In-Memory Cache HIT for key: ${cacheKey.slice(0, 12)}...`);
    return memEntry.response;
  }

  // 2. Check persistent Firestore cache
  try {
    const cacheRef = doc(db, "ai-cache", cacheKey);
    const cacheSnap = await getDoc(cacheRef);
    
    if (cacheSnap.exists()) {
      const data = cacheSnap.data();
      if (data && typeof data.response === "string") {
        console.log(`[CacheService] Firestore Cache HIT for key: ${cacheKey.slice(0, 12)}...`);
        memoryCache.set(cacheKey, { response: data.response, timestamp: Date.now() });
        return data.response;
      }
    }
    return null;
  } catch (error) {
    console.warn(`[CacheService] Firestore cache check note:`, error);
    return null; // Fail gracefully to AI generation
  }
}

/**
 * Saves a new AI response to both in-memory cache and Firestore
 */
export async function saveCachedResponse(cacheKey: string, response: string): Promise<void> {
  // 1. Immediately store in memory
  memoryCache.set(cacheKey, { response, timestamp: Date.now() });

  // 2. Persist to Firestore asynchronously
  try {
    const cacheRef = doc(db, "ai-cache", cacheKey);
    await setDoc(cacheRef, {
      cacheKey,
      response,
      createdAt: serverTimestamp()
    });
    console.log(`[CacheService] Successfully saved response to Firestore cache (${cacheKey.slice(0, 12)}...)`);
  } catch (error) {
    console.warn(`[CacheService] Firestore cache write note:`, error);
    // In-memory cache is already populated, so user experience remains fast
  }
}
