import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import { upsertTeacherProfile } from "@/services/auth/profile.service";

export type AuthStateChangeCallback = (event: AuthChangeEvent, session: Session | null) => void;

function getOAuthRedirectUrl() {
  return `${window.location.origin}/auth/callback`;
}

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getOAuthRedirectUrl(),
      scopes: import.meta.env.VITE_GOOGLE_CLASSROOM_SCOPES,
    },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getCurrentSession() {
  return supabase.auth.getSession();
}

export async function getCurrentUser() {
  return supabase.auth.getUser();
}

export function onAuthStateChange(callback: AuthStateChangeCallback) {
  return supabase.auth.onAuthStateChange(callback);
}

export async function ensureTeacherProfile(user: User) {
  await upsertTeacherProfile(user);
}

export async function ensureSessionProfile(session: Session | null) {
  if (!session?.user) {
    return;
  }

  await ensureTeacherProfile(session.user);
}

export function getReadableAuthError(error: unknown, fallback = "Something went wrong while signing you in.") {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
