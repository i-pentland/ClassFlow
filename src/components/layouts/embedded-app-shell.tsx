import type { PropsWithChildren } from "react";

import { EmbeddedModeBanner } from "@/components/embedded/embedded-mode-banner";

export function EmbeddedAppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-hero-glow">
      <EmbeddedModeBanner />
      <main>{children}</main>
    </div>
  );
}
