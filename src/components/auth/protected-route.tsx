import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";
import { buildAuthRedirectUrl } from "@/lib/auth-intended-route";

export function ProtectedRoute() {
  const { isLoading, session } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="rounded-[1.5rem] border border-white/80 bg-white/90 px-6 py-5 text-sm text-muted-foreground shadow-gentle">
          Restoring your session...
        </div>
      </div>
    );
  }

  if (!session) {
    const intendedRoute = `${location.pathname}${location.search}${location.hash}`;

    return <Navigate to={buildAuthRedirectUrl(intendedRoute)} replace />;
  }

  return <Outlet />;
}
