import { Link, useLocation } from "react-router-dom";

import { getIframeLaunchContextFromSearch } from "@/features/iframe-context/iframe-context.service";

function formatIframeType(iframeType: string) {
  return iframeType.split("_").join(" ");
}

export function EmbeddedModeBanner() {
  if (!import.meta.env.DEV) {
    return null;
  }

  const location = useLocation();
  const launchContext = getIframeLaunchContextFromSearch(location.search);

  if (launchContext.launchSource !== "google_classroom_addon") {
    return null;
  }

  return (
    <div className="border-b border-amber-200/70 bg-amber-50/90">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-2 text-sm text-amber-900 lg:px-8">
        <p>
          Add-on iframe preview: launched from Google Classroom
          {launchContext.iframeType ? ` · ${formatIframeType(launchContext.iframeType)}` : ""}
          {launchContext.lmsCourseId ? ` · course ${launchContext.lmsCourseId}` : ""}
          {launchContext.lmsAssignmentId ? ` · assignment ${launchContext.lmsAssignmentId}` : ""}.
          {launchContext.lmsSubmissionId ? ` · submission ${launchContext.lmsSubmissionId}` : ""}
        </p>
        <Link to={location.pathname} className="font-medium text-amber-900/80 transition-colors hover:text-amber-950">
          Exit add-on preview
        </Link>
      </div>
    </div>
  );
}
