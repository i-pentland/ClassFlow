import type { AnalysisPattern, Assignment, ClassRoom, LearningObjective, Student } from "@/types/domain";

export type DashboardClassCard = {
  classRoom: ClassRoom;
  assignmentCount: number;
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
  activeObjectives: LearningObjective[];
  availableObjectives: LearningObjective[];
};

export type AssignmentPageData = {
  classRoom: ClassRoom;
  assignment: AssignmentListItem;
  targetedObjectives: LearningObjective[];
};
