"use client";

import { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, Mail, Lock, Loader2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { user, loading: authLoading } = useAuth();

  // 1. Auto-redirect as soon as user state becomes authenticated
  useEffect(() => {
    if (user && !authLoading) {
      window.location.href = "/dashboard";
    }
  }, [user, authLoading]);

  // 2. Handle Google redirect callback if signInWithRedirect was used
  useEffect(() => {
    let isMounted = true;
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user && isMounted) {
          window.location.href = "/dashboard";
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const error = err as { code?: string; message?: string };
        console.error("Redirect sign-in error:", error);
        if (error.code === "auth/unauthorized-domain") {
          setError(
            "This domain is not authorized in Firebase. Add your Vercel URL to Firebase Console > Authentication > Settings > Authorized Domains."
          );
        } else if (error.code === "auth/operation-not-allowed") {
          setError(
            "Google Sign-In is disabled in Firebase. Go to Firebase Console > Authentication > Sign-in method > Enable Google."
          );
        } else if (error.code && error.code !== "auth/popup-closed-by-user") {
          setError(`[${error.code}]: ${error.message || "Redirect authentication failed."}`);
        }
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Authentication failed. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError("");
    setLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      const userCredential = await signInWithPopup(auth, provider);
      if (userCredential?.user) {
        window.location.href = "/dashboard";
        return;
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      console.warn("Google signInWithPopup error code:", error.code);

      if (error.code === "auth/popup-blocked" || error.code === "auth/popup-closed-by-user") {
        try {
          // If popup was blocked or cross-origin popup communication failed, fall back to redirect
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectErr: unknown) {
          const rErr = redirectErr as { code?: string; message?: string };
          console.error("Fallback signInWithRedirect failed:", rErr);
          setError("Google sign-in could not complete. Please check your browser popup settings or Firebase setup.");
          setLoading(false);
        }
      } else if (error.code === "auth/operation-not-allowed") {
        setError(
          "Google Sign-In is DISABLED in Firebase. Go to Firebase Console > Authentication > Sign-in method > Click Google > Enable it, choose a Support Email, and click Save."
        );
        setLoading(false);
      } else if (error.code === "auth/unauthorized-domain") {
        setError(
          "This Vercel domain is not authorized. Go to Firebase Console > Authentication > Settings > Authorized Domains, and add your Vercel URL."
        );
        setLoading(false);
      } else if (error.code === "auth/invalid-api-key" || error.code === "auth/api-key-not-valid") {
        setError(
          "Invalid Firebase API Key. Please make sure you redeployed on Vercel after adding your NEXT_PUBLIC_FIREBASE_* keys."
        );
        setLoading(false);
      } else {
        setError(error.message ? `[${error.code || "auth/error"}]: ${error.message}` : "Google authentication failed.");
        setLoading(false);
      }
    }
  };

  // If user is already authenticated or verifying redirect token, show seamless loading
  if (authLoading || user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm font-medium animate-pulse">
          {user ? "Redirecting to your dashboard..." : "Verifying session..."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center justify-center space-x-2 text-primary mb-6">
            <Sparkles className="w-8 h-8" />
            <span className="text-2xl font-bold tracking-tight text-foreground">Resume AI</span>
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {isLogin ? "Welcome back" : "Create an account"}
          </h1>
          <p className="text-muted-foreground">
            {isLogin ? "Sign in to access your analytics" : "Sign up to start optimizing your resume"}
          </p>
        </div>

        <div className="bg-card rounded-2xl shadow-xl shadow-border/50 p-8 border border-border">
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg text-sm font-medium border border-destructive/20">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-foreground placeholder:text-muted-foreground"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-foreground placeholder:text-muted-foreground"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? "Sign In" : "Sign Up")}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-3 border border-border rounded-xl shadow-sm bg-background text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="h-5 w-5 mr-2" aria-hidden="true" viewBox="0 0 24 24">
                  <path
                    d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                    fill="#EA4335"
                  />
                  <path
                    d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26537 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                    fill="#34A853"
                  />
                </svg>
                Google
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
