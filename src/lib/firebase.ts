import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const getAuthDomain = (): string => {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  const configuredDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim();

  if (typeof window !== "undefined") {
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (isLocalhost) {
      // Local HTTP dev requires Firebase Hosting's auth origin so popup iframe postMessage is never blocked cross-origin
      if (projectId) return `${projectId}.firebaseapp.com`;
      return configuredDomain || "";
    }

    // Production & preview deployments use same-origin `/__/auth/*` proxy to prevent browser storage partitioning
    return window.location.host;
  }

  if (configuredDomain) return configuredDomain;
  if (projectId) return `${projectId}.firebaseapp.com`;
  return "";
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: getAuthDomain(),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch(() => {
    // Persistence falls back cleanly if browser storage is restricted
  });
}

export const db = getFirestore(app);
export default app;
