import type { AnalysisPattern, Assignment, ClassRoom, LearningObjective, Student } from "@/types/domain";
import type { SubmissionReference } from "@/services/lms/lms.types";
import type { SubmissionPreparationSummary } from "@/services/submissions/submission-extraction.types";

export type DashboardClassCard = {
  classRoom: ClassRoom;
  assignmentCount: number;
  debugAssignments?: {
    id: string;
    title: string;
    sourceAssignmentRef: string;
    debugSubmissions?: {
      id: string;
      sourceSubmissionRef: string;
      studentName: string;
    }[];
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
  submissionPreparationSummary: SubmissionPreparationSummary | null;
  observationPatterns: ResolvedAnalysisPattern[];
  observationIssue: string | null;
  selectedSubmission: SubmissionReference | null;
  debugState: StudentWorkReviewDebugState | null;
};

export type StudentWorkReviewDebugState = {
  providerName: string;
  courseId: string | null;
  assignmentId: string | null;
  currentSubmissionId: string | null;
  requestMade: boolean;
  assignmentResolved: boolean;
  submissionFetchStatus: "not_attempted" | "success" | "empty" | "failed" | "mapping_zero";
  rawSubmissionCount: number | null;
  mappedSubmissionCount: number;
  apiError: string | null;
  rawSubmissionStateCounts: Record<string, number>;
  notes: string[];
};
