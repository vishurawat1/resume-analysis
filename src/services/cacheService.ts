import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

/**
 * Retrieves a cached AI response from Firestore
 */
export async function getCachedResponse(cacheKey: string): Promise<string | null> {
  try {
    const cacheRef = doc(db, "ai-cache", cacheKey);
    const cacheSnap = await getDoc(cacheRef);
    
    if (cacheSnap.exists()) {
      return cacheSnap.data().response as string;
    }
    return null;
  } catch (error) {
    console.error("Failed to check cache:", error);
    return null; // Fail gracefully
  }
}

/**
 * Saves a new AI response to the Firestore cache
 */
export async function saveCachedResponse(cacheKey: string, response: string): Promise<void> {
  try {
    const cacheRef = doc(db, "ai-cache", cacheKey);
    await setDoc(cacheRef, {
      cacheKey,
      response,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Failed to save cache:", error);
    // Do not throw; caching failures shouldn't break the user experience
  }
}
