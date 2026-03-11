import type { IframeLaunchContext } from "@/features/iframe-context/iframe-context.types";

function inferIframeTypeFromPathname(pathname: string): IframeLaunchContext["iframeType"] {
  if (pathname.startsWith("/addon/attachment-discovery")) {
    return "attachment_discovery";
  }

  if (pathname.startsWith("/addon/teacher-view")) {
    return "teacher_view";
  }

  if (pathname.startsWith("/addon/student-work-review")) {
    return "student_work_review";
  }

  return undefined;
}

function normalizeLaunchSource(source: string | null): IframeLaunchContext["launchSource"] {
  if (source === "classroom_addon" || source === "google_classroom_addon" || source === "classroom") {
    return "google_classroom_addon";
  }

  return "standalone";
}

export function getIframeLaunchContextFromSearch(search: string): IframeLaunchContext {
  const params = new URLSearchParams(search);
  const launchSource = normalizeLaunchSource(params.get("source"));

  if (launchSource === "google_classroom_addon") {
    const iframeType = params.get("iframeType");

    return {
      launchSource,
      iframeType:
        iframeType === "attachment_discovery" ||
        iframeType === "teacher_view" ||
        iframeType === "student_work_review"
          ? iframeType
          : undefined,
      lmsCourseId: params.get("courseId") ?? undefined,
      lmsAssignmentId: params.get("assignmentId") ?? undefined,
      lmsSubmissionId: params.get("submissionId") ?? undefined,
      lmsAttachmentId: params.get("attachmentId") ?? undefined,
    };
  }

  return {
    launchSource: "standalone",
  };
}

export function getIframeLaunchContextFromUrl(url: URL): IframeLaunchContext {
  return getIframeLaunchContextFromLocation(url.pathname, url.search);
}

export function getIframeLaunchContextFromLocation(pathname: string, search: string): IframeLaunchContext {
  const context = getIframeLaunchContextFromSearch(search);
  const inferredIframeType = inferIframeTypeFromPathname(pathname);

  if (pathname.startsWith("/addon/")) {
    return {
      ...context,
      launchSource: "google_classroom_addon",
      iframeType: context.iframeType ?? inferredIframeType,
    };
  }

  if (inferredIframeType && context.launchSource === "google_classroom_addon") {
    return {
      ...context,
      iframeType: context.iframeType ?? inferredIframeType,
    };
  }

  return context;
}

export function isGoogleClassroomAddonLaunch(context: IframeLaunchContext): boolean {
  return context.launchSource === "google_classroom_addon";
}

export function isStudentWorkReviewContext(context: IframeLaunchContext): boolean {
  return (
    context.launchSource === "google_classroom_addon" &&
    context.iframeType === "student_work_review"
  );
}

export function isTeacherViewContext(context: IframeLaunchContext): boolean {
  return (
    context.launchSource === "google_classroom_addon" &&
    context.iframeType === "teacher_view"
  );
}

export function isAttachmentDiscoveryContext(context: IframeLaunchContext): boolean {
  return (
    context.launchSource === "google_classroom_addon" &&
    context.iframeType === "attachment_discovery"
  );
}
