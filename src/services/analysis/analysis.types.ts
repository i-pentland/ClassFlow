import type {
  Assignment,
  Class,
  LearningObjective,
} from "@/services/lms/lms.types";
import type { IframeLaunchContext } from "@/features/iframe-context/iframe-context.types";
import type { StudentSubmissionInput } from "@/services/submissions/submission-extraction.types";

// Derived pattern output that can be persisted without retaining raw submission text.
export interface DerivedPattern {
  title: string;
  description: string;
  objectiveId: string;
  affectedStudentRefs: string[];
  confidence: number;
}

export interface AnalysisResult {
  assignmentId: string;
  sourceAssignmentRef: string;
  sourceCourseRef: string;
  patterns: DerivedPattern[];
}

export interface RunAssignmentAnalysisInput {
  class: Class;
  assignment: Assignment;
  objectives: LearningObjective[];
  submissions: StudentSubmissionInput[];
  launchContext: IframeLaunchContext;
}
