export interface ErrorPattern {
  id: string;
  assignmentId: string;
  sourceAssignmentRef: string;
  sourceCourseRef: string;
  title: string;
  description: string;
  objectiveId: string;
  affectedStudentRefs: string[];
  studentsAffected: number;
  confidence: number;
  dismissed: boolean;
}

export interface AnalysisRun {
  id: string;
  assignmentId: string;
  sourceAssignmentRef: string;
  sourceCourseRef: string;
  status: "pending" | "completed" | "failed";
  provider: string;
  createdAt: string;
  objectiveIds: string[];
  affectedStudentRefs: string[];
  patternCount: number;
}
