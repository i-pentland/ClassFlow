import { Link, NavLink, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const navigate = useNavigate();
  const { session, signOut, isLoading } = useAuth();
  const navItems = [
    { label: "Home", to: "/" },
    ...(session ? [{ label: "Dashboard", to: "/dashboard" }] : []),
    ...(!session ? [{ label: "Sign in", to: "/auth" }] : []),
  ];

  const handleSignOut = async () => {
    const { error } = await signOut();

    if (!error) {
      navigate("/auth", { replace: true });
    }
  };

  return (
    <header className="sticky top-0 z-20 border-b border-white/60 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary">
            CF
          </div>
          <div>
            <p className="text-base font-bold">ClassFlow</p>
            <p className="text-xs text-muted-foreground">Observation-first classroom insight</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                  isActive && "bg-secondary text-foreground",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        {session ? (
          <Button variant="outline" size="sm" onClick={() => void handleSignOut()} disabled={isLoading}>
            Sign out
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link to="/auth">Sign in</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
