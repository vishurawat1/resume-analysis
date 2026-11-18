import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const getAuthDomain = () => {
  if (typeof window !== "undefined") {
    // On localhost, use the standard firebaseapp domain
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "resume-analysis-bd6d0.firebaseapp.com";
    }
    // On live production (vr-resume-analysis.vercel.app), ALWAYS use same-origin host
    // to prevent Chrome/Safari third-party cookie and storage partitioning blocks
    return window.location.host;
  }
  // Build / SSR fallback
  return "vr-resume-analysis.vercel.app";
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAoqvK4y4j1Sv3DpRGA7qZsqbU6CczkekY",
  authDomain: getAuthDomain(),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "resume-analysis-bd6d0",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "resume-analysis-bd6d0.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "545258110746",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:545258110746:web:150a6a43b87550c520b6a3",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-G5CNHBX4WD",
};

// Initialize Firebase only if it hasn't been initialized yet
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Ensure local persistence is active in browser environments
if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn("Firebase persistence error:", err);
  });
}

export const db = getFirestore(app);
export default app;
