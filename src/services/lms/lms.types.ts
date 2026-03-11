export interface Student {
  id: string;
  name: string;
  lmsStudentRef: string;
}

export interface LearningObjective {
  id: string;
  title: string;
  description: string;
}

export interface Course {
  id: string;
  title: string;
  section: string;
  periodLabel: string;
  studentIds: string[];
  learningObjectiveIds: string[];
  assignmentIds: string[];
  sourceCourseRef: string;
}

export interface Assignment {
  id: string;
  classId: string;
  title: string;
  dueDate: string;
  targetedObjectiveIds: string[];
  summary: string;
  sourceAssignmentRef: string;
  sourceCourseRef: string;
}

export type Class = Course;

export interface SubmissionReference {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  contentType: "text" | "metadata";
  contentPreview: string;
  sourceSubmissionRef: string;
  textContent?: string;
}

export interface SubmissionAttachment {
  id: string;
  submissionRef: string;
  title: string;
  mimeType: string;
  kind: "drive_file" | "link" | "form" | "youtube" | "short_answer";
  url?: string;
  driveFileId?: string;
  textContent?: string;
}

export type LmsIframeType =
  | "attachment_discovery"
  | "teacher_view"
  | "student_work_review";

export interface LmsAddonContext {
  iframeType?: LmsIframeType;
  lmsCourseId?: string;
  lmsAssignmentId?: string;
  lmsSubmissionId?: string;
  lmsAttachmentId?: string;
}

export interface GoogleClassroomScaffoldConfig {
  clientId?: string;
  apiBaseUrl?: string;
  scopes: string[];
}
