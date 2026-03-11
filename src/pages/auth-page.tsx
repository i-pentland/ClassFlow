import { Chrome, LoaderCircle, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { AppShell } from "@/components/layouts/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import {
  getStoredIntendedRoute,
  persistIntendedRoute,
} from "@/lib/auth-intended-route";
import { getReadableAuthError } from "@/lib/auth";

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(searchParams.get("error"));
  const { session, isLoading, signInWithGoogle, error, clearError } = useAuth();
  const redirectTo = searchParams.get("redirectTo");

  useEffect(() => {
    if (!isLoading && session) {
      navigate(redirectTo ?? getStoredIntendedRoute() ?? "/dashboard", { replace: true });
    }
  }, [isLoading, navigate, redirectTo, session]);

  useEffect(() => {
    setPageError(searchParams.get("error"));
  }, [searchParams]);

  useEffect(() => {
    // Preserve the originally requested route across the Google OAuth round-trip.
    // This is required for add-on testing because teachers often start on /addon/*
    // routes with LMS context query params instead of the standalone dashboard.
    persistIntendedRoute(redirectTo);
  }, [redirectTo]);

  const handleGoogleSignIn = async () => {
    setIsRedirecting(true);
    clearError();
    setPageError(null);

    persistIntendedRoute(redirectTo ?? `${location.pathname}${location.search}${location.hash}`);

    const { error } = await signInWithGoogle();

    if (error) {
      setPageError(getReadableAuthError(error));
      setIsRedirecting(false);
      return;
    }

    searchParams.delete("error");
    setSearchParams(searchParams, { replace: true });
  };

  const activeError = pageError ?? error;

  return (
    <AppShell>
      <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl items-center px-6 py-16 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-6">
            <Badge variant="accent" className="w-fit">
              Teacher authentication
            </Badge>
            <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">
              Connect your classroom, keep your workflow.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-muted-foreground">
              Sign in with Google to open the teacher dashboard. Classroom sync is still mocked for now, so this step only handles secure access to the app.
            </p>
            <div className="rounded-[1.5rem] border border-white/80 bg-white/80 p-6 shadow-gentle">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Privacy and role boundaries stay visible</p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    ClassFlow does not grade students, send student-facing feedback, or change assignment workflows in this MVP.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <Card className="border-white/80 bg-white/90">
            <CardHeader>
              <CardTitle>Teacher sign in</CardTitle>
              <CardDescription>
                Use Google to continue into the authenticated app. Add-on routes return to their
                original embedded context after sign-in.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                size="lg"
                className="w-full justify-center"
                onClick={() => void handleGoogleSignIn()}
                disabled={isRedirecting || isLoading}
              >
                {isRedirecting ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Redirecting to Google...
                  </>
                ) : (
                  <>
                    <Chrome className="h-4 w-4" />
                    Continue with Google
                  </>
                )}
              </Button>
              {activeError ? (
                <p className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
                  {activeError}
                </p>
              ) : null}
              <p className="rounded-[1.25rem] bg-secondary/60 px-4 py-3 text-sm leading-6 text-muted-foreground">
                Google sign-in is handled through Supabase Auth. Classroom data remains on the current mock provider until sync is added later.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}
