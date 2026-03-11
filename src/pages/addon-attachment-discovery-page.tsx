import { useLoaderData, useLocation } from "react-router-dom";

import { AttachmentDiscoveryEmbedded } from "@/components/embedded/attachment-discovery-embedded";
import { EmbeddedAppShell } from "@/components/layouts/embedded-app-shell";
import { getIframeLaunchContextFromLocation } from "@/features/iframe-context/iframe-context.service";
import type { DashboardClassCard } from "@/types/view-models";

export function AddonAttachmentDiscoveryPage() {
  const classes = useLoaderData() as DashboardClassCard[];
  const location = useLocation();
  const launchContext = getIframeLaunchContextFromLocation(location.pathname, location.search);

  return (
    <EmbeddedAppShell>
      <AttachmentDiscoveryEmbedded launchContext={launchContext} classes={classes} />
    </EmbeddedAppShell>
  );
}
