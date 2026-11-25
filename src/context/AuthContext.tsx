"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { syncAuthSessionIsolation } from "@/lib/userStorage";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Use authStateReady to guarantee local IndexedDB persistence hydration has resolved
    if (typeof auth.authStateReady === "function") {
      auth.authStateReady().then(() => {
        if (isMounted) {
          syncAuthSessionIsolation(auth.currentUser?.uid ?? null);
          setUser(auth.currentUser);
          setLoading(false);
        }
      });
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        if (isMounted) {
          syncAuthSessionIsolation(currentUser?.uid ?? null);
          setUser(currentUser);
          setLoading(false);
        }
      },
      () => {
        if (isMounted) {
          syncAuthSessionIsolation(null);
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const signOut = async () => {
    syncAuthSessionIsolation(null);
    await firebaseSignOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
