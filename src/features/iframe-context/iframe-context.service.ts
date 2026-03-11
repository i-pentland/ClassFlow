import type { IframeLaunchContext } from "@/features/iframe-context/iframe-context.types";

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
  return getIframeLaunchContextFromSearch(url.search);
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
