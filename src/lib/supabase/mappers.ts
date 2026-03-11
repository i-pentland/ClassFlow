import type { AnalysisPattern, Assignment, ClassRoom, LearningObjective } from "@/types/domain";
import type { Database } from "@/types/supabase";

type ClassRow = Database["public"]["Tables"]["classes"]["Row"];
type AssignmentRow = Database["public"]["Tables"]["assignments"]["Row"];
type ObjectiveRow = Database["public"]["Tables"]["learning_objectives"]["Row"];
type AssignmentObjectiveRow = Database["public"]["Tables"]["assignment_objectives"]["Row"];
type ErrorPatternRow = Database["public"]["Tables"]["error_patterns"]["Row"];
type AnalysisRunRow = Database["public"]["Tables"]["analysis_runs"]["Row"];

export function mapClassRowToDomain(
  classRow: ClassRow,
  assignmentIds: string[] = [],
  learningObjectiveIds: string[] = [],
): ClassRoom {
  return {
    id: classRow.id,
    title: classRow.title,
    section: classRow.section ?? "",
    periodLabel: classRow.period_label ?? "",
    studentIds: [],
    assignmentIds,
    learningObjectiveIds,
    sourceCourseRef: classRow.id,
  };
}

export function mapAssignmentRowToDomain(
  assignmentRow: AssignmentRow,
  targetedObjectiveIds: string[] = [],
): Assignment {
  return {
    id: assignmentRow.id,
    classId: assignmentRow.class_id,
    title: assignmentRow.title,
    dueDate: assignmentRow.due_date ?? "",
    targetedObjectiveIds,
    summary: assignmentRow.summary,
    sourceAssignmentRef: assignmentRow.id,
    sourceCourseRef: assignmentRow.class_id,
  };
}

export function mapObjectiveRowToDomain(objectiveRow: ObjectiveRow): LearningObjective {
  return {
    id: objectiveRow.id,
    title: objectiveRow.title,
    description: objectiveRow.description,
  };
}

export function mapPatternRowToDomain(patternRow: ErrorPatternRow): AnalysisPattern {
  return {
    id: patternRow.id,
    assignmentId: patternRow.assignment_id,
    sourceAssignmentRef: patternRow.assignment_id,
    sourceCourseRef: "",
    title: patternRow.title,
    description: patternRow.description,
    objectiveId: patternRow.objective_id ?? "",
    affectedStudentRefs: Array.isArray(patternRow.affected_student_ids)
      ? patternRow.affected_student_ids.filter((value): value is string => typeof value === "string")
      : [],
    studentsAffected: patternRow.students_affected,
    confidence: 0.5,
    dismissed: patternRow.dismissed_at !== null,
  };
}

export type AssignmentObjectiveMapping = Pick<AssignmentObjectiveRow, "id" | "assignment_id" | "objective_id" | "teacher_id" | "created_at">;
export type AnalysisRunRecord = AnalysisRunRow;
