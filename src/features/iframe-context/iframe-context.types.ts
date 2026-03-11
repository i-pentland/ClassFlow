export type LaunchSource = "standalone" | "google_classroom_addon";

export type ClassroomIframeType =
  | "attachment_discovery"
  | "teacher_view"
  | "student_work_review";

export interface IframeLaunchContext {
  launchSource: LaunchSource;
  iframeType?: ClassroomIframeType;
  lmsCourseId?: string;
  lmsAssignmentId?: string;
  lmsSubmissionId?: string;
  lmsAttachmentId?: string;
}
