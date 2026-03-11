import type { AnalysisPattern, Assignment, ClassRoom, LearningObjective, Student } from "@/types/domain";
import type { SubmissionReference } from "@/services/lms/lms.types";

export type DashboardClassCard = {
  classRoom: ClassRoom;
  assignmentCount: number;
  debugAssignments?: {
    id: string;
    title: string;
    sourceAssignmentRef: string;
  }[];
};

export type AssignmentListItem = Assignment & {
  targetedObjectives: LearningObjective[];
  submissionCount: number;
};

export type ResolvedAnalysisPattern = AnalysisPattern & {
  relatedObjective: LearningObjective | null;
  affectedStudents: Student[];
};

export type ClassPageData = {
  classRoom: ClassRoom;
  assignments: AssignmentListItem[];
  assignmentLoadIssue?: string | null;
  activeObjectives: LearningObjective[];
  availableObjectives: LearningObjective[];
};

export type AssignmentPageData = {
  classRoom: ClassRoom;
  assignment: AssignmentListItem;
  targetedObjectives: LearningObjective[];
};

export type StudentWorkReviewPageData = {
  assignmentData: AssignmentPageData | null;
  assignmentContextIssue: string | null;
  submissionReferences: SubmissionReference[];
  submissionLoadIssue: string | null;
  selectedSubmission: SubmissionReference | null;
};
