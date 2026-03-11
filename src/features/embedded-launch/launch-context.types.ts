export interface LaunchContext {
  launchSource: "standalone" | "google_classroom_embedded";
  lmsCourseId?: string;
  lmsAssignmentId?: string;
}
