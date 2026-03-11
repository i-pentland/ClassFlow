import { Outlet } from "react-router-dom";

import { EmbeddedAppShell } from "@/components/layouts/embedded-app-shell";

export function AddonRouteLayout() {
  return (
    <EmbeddedAppShell>
      <Outlet />
    </EmbeddedAppShell>
  );
}
