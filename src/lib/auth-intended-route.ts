const INTENDED_ROUTE_STORAGE_KEY = "classflow.auth.intendedRoute";

function normalizeIntendedRoute(route: string | null | undefined): string | null {
  if (!route || !route.startsWith("/")) {
    return null;
  }

  if (route.startsWith("/auth")) {
    return null;
  }

  return route;
}

export function buildAuthRedirectUrl(intendedRoute: string) {
  return `/auth?redirectTo=${encodeURIComponent(intendedRoute)}`;
}

export function persistIntendedRoute(intendedRoute: string | null | undefined) {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedRoute = normalizeIntendedRoute(intendedRoute);

  if (!normalizedRoute) {
    window.sessionStorage.removeItem(INTENDED_ROUTE_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(INTENDED_ROUTE_STORAGE_KEY, normalizedRoute);
}

export function getStoredIntendedRoute() {
  if (typeof window === "undefined") {
    return null;
  }

  return normalizeIntendedRoute(window.sessionStorage.getItem(INTENDED_ROUTE_STORAGE_KEY));
}

export function consumeStoredIntendedRoute() {
  const intendedRoute = getStoredIntendedRoute();

  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(INTENDED_ROUTE_STORAGE_KEY);
  }

  return intendedRoute;
}
