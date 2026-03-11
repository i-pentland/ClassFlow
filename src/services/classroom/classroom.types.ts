export interface Student {
  id: string;
  name: string;
}

export interface LearningObjective {
  id: string;
  title: string;
  description: string;
}

export interface Assignment {
  id: string;
  classId: string;
  title: string;
  dueDate: string;
  targetedObjectiveIds: string[];
  summary: string;
}

export interface Class {
  id: string;
  title: string;
  section: string;
  periodLabel: string;
  studentIds: string[];
  learningObjectiveIds: string[];
  assignmentIds: string[];
}

export interface StudentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  submittedAt: string;
  contentPreview: string;
}
