import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { AppShell } from "@/components/layouts/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ensureSessionProfile, getCurrentSession, getReadableAuthError } from "@/lib/auth";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Completing your sign-in...");

  useEffect(() => {
    let isMounted = true;

    async function completeAuth() {
      const errorDescription = searchParams.get("error_description");

      if (errorDescription) {
        navigate(`/auth?error=${encodeURIComponent(errorDescription)}`, { replace: true });
        return;
      }

      const { data, error } = await getCurrentSession();

      if (error) {
        navigate(`/auth?error=${encodeURIComponent(getReadableAuthError(error))}`, { replace: true });
        return;
      }

      if (!data.session) {
        navigate("/auth?error=We%20could%20not%20find%20an%20active%20session.", { replace: true });
        return;
      }

      try {
        await ensureSessionProfile(data.session);
        navigate("/dashboard", { replace: true });
      } catch (profileError) {
        if (isMounted) {
          setMessage("Signed in, but we could not finish preparing your profile.");
        }

        navigate(`/auth?error=${encodeURIComponent(getReadableAuthError(profileError))}`, { replace: true });
      }
    }

    void completeAuth();

    return () => {
      isMounted = false;
    };
  }, [navigate, searchParams]);

  return (
    <AppShell>
      <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-3xl items-center justify-center px-6 py-16 lg:px-8">
        <Card className="w-full max-w-xl border-white/80 bg-white/90">
          <CardHeader>
            <CardTitle>Signing you in</CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              Please wait while ClassFlow confirms your session and prepares your teacher profile.
            </p>
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
