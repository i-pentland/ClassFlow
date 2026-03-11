import type { PropsWithChildren } from "react";

import { EmbeddedModeBanner } from "@/components/embedded/embedded-mode-banner";
import { AppHeader } from "@/components/app-header";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-hero-glow">
      <AppHeader />
      <EmbeddedModeBanner />
      <main>{children}</main>
    </div>
  );
}
