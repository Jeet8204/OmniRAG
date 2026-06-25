import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "./firebase";

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

/**
 * Subscribes to Firebase auth state changes and keeps the ID token fresh.
 * Firebase tokens expire after 1 hour; getIdToken(true) auto-refreshes them.
 */
export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        setUser(firebaseUser);
        setToken(idToken);
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Refresh the token before it expires (every 55 minutes)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      const freshToken = await user.getIdToken(true);
      setToken(freshToken);
    }, 55 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const handleSignOut = () => signOut(auth);

  return { user, token, loading, signOut: handleSignOut };
}

/**
 * Returns Authorization headers for every API call.
 * Usage: fetch('/api/chat', { headers: authHeaders(token), ... })
 */
export function authHeaders(token: string | null): Record<string, string> {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}