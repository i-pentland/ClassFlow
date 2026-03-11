import type { LaunchContext } from "@/features/embedded-launch/launch-context.types";

export function getLaunchContextFromSearch(search: string): LaunchContext {
  const params = new URLSearchParams(search);
  const source = params.get("source");
  const courseId = params.get("courseId") ?? undefined;
  const assignmentId = params.get("assignmentId") ?? undefined;

  if (source === "classroom") {
    return {
      launchSource: "google_classroom_embedded",
      lmsCourseId: courseId,
      lmsAssignmentId: assignmentId,
    };
  }

  return {
    launchSource: "standalone",
    lmsCourseId: courseId,
    lmsAssignmentId: assignmentId,
  };
}

export function getLaunchContextFromUrl(url: URL): LaunchContext {
  return getLaunchContextFromSearch(url.search);
}

export function isEmbeddedLaunchContext(launchContext: LaunchContext) {
  return launchContext.launchSource === "google_classroom_embedded";
}
