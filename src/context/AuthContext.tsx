import type { Session, User } from "@supabase/supabase-js";
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  ensureSessionProfile,
  getCurrentSession,
  getReadableAuthError,
  onAuthStateChange,
  signInWithGoogle,
  signOut,
} from "@/lib/auth";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signInWithGoogle: typeof signInWithGoogle;
  signOut: typeof signOut;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialSession() {
      const { data, error } = await getCurrentSession();

      if (!isMounted) {
        return;
      }

      if (error) {
        setError(getReadableAuthError(error, "We could not restore your session."));
        setIsLoading(false);
        return;
      }

      setSession(data.session);
      setUser(data.session?.user ?? null);

      try {
        await ensureSessionProfile(data.session);
      } catch (profileError) {
        if (isMounted) {
          setError(getReadableAuthError(profileError, "Signed in, but we could not prepare your profile."));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialSession();

    const {
      data: { subscription },
    } = onAuthStateChange((_, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      void ensureSessionProfile(nextSession).catch((profileError) => {
        setError(getReadableAuthError(profileError, "Signed in, but we could not prepare your profile."));
      });

      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      isLoading,
      error,
      signInWithGoogle,
      signOut,
      clearError: () => setError(null),
    }),
    [error, isLoading, session, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
