import { supabase } from "@/lib/supabase";
import type { ClassroomProvider } from "@/services/classroom/classroom.provider";
import type {
  Assignment,
  Class,
  LearningObjective,
  Student,
  StudentSubmission,
} from "@/services/classroom/classroom.types";
import type { Database } from "@/types/supabase";

type ClassRow = Database["public"]["Tables"]["classes"]["Row"];
type AssignmentRow = Database["public"]["Tables"]["assignments"]["Row"];
type LearningObjectiveRow = Database["public"]["Tables"]["learning_objectives"]["Row"];
type AssignmentObjectiveRow = Database["public"]["Tables"]["assignment_objectives"]["Row"];

function mapObjectiveRow(row: LearningObjectiveRow): LearningObjective {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
  };
}

function mapAssignmentRow(
  row: AssignmentRow,
  targetedObjectiveIds: string[],
): Assignment {
  return {
    id: row.id,
    classId: row.class_id,
    title: row.title,
    dueDate: row.due_date ?? "",
    targetedObjectiveIds,
    summary: row.summary,
  };
}

function mapClassRow(
  row: ClassRow,
  assignmentIds: string[],
  learningObjectiveIds: string[],
): Class {
  return {
    id: row.id,
    title: row.title,
    section: row.section ?? "",
    periodLabel: row.period_label ?? "",
    studentIds: [],
    learningObjectiveIds,
    assignmentIds,
  };
}

async function listAssignmentRowsForClass(classId: string): Promise<AssignmentRow[]> {
  const { data, error } = await supabase
    .from("assignments")
    .select("*")
    .eq("class_id", classId)
    .order("due_date", { ascending: false });

  if (error) {
    throw error;
  }

  return data as AssignmentRow[];
}

async function listAssignmentObjectiveRows(assignmentIds: string[]): Promise<AssignmentObjectiveRow[]> {
  if (assignmentIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("assignment_objectives")
    .select("*")
    .in("assignment_id", assignmentIds);

  if (error) {
    throw error;
  }

  return data as AssignmentObjectiveRow[];
}

function buildObjectiveIdsByAssignment(
  rows: AssignmentObjectiveRow[],
): Map<string, string[]> {
  const mappings = new Map<string, string[]>();

  for (const row of rows) {
    const current = mappings.get(row.assignment_id) ?? [];
    current.push(row.objective_id);
    mappings.set(row.assignment_id, current);
  }

  return mappings;
}

async function getObjectivesForAssignmentIds(assignmentIds: string[]): Promise<LearningObjective[]> {
  const assignmentObjectiveRows = await listAssignmentObjectiveRows(assignmentIds);
  const objectiveIds = [...new Set(assignmentObjectiveRows.map((row) => row.objective_id))];

  if (objectiveIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("learning_objectives")
    .select("*")
    .in("id", objectiveIds)
    .order("title");

  if (error) {
    throw error;
  }

  return (data as LearningObjectiveRow[]).map(mapObjectiveRow);
}

export function createSupabaseClassroomProvider(): ClassroomProvider {
  return {
    async getClasses() {
      const { data, error } = await supabase.from("classes").select("*").order("title");

      if (error) {
        throw error;
      }

      const classRows = data as ClassRow[];

      return Promise.all(
        classRows.map(async (row) => {
          const assignmentRows = await listAssignmentRowsForClass(row.id);
          const objectives = await getObjectivesForAssignmentIds(assignmentRows.map((assignment) => assignment.id));

          return mapClassRow(
            row,
            assignmentRows.map((assignment) => assignment.id),
            objectives.map((objective) => objective.id),
          );
        }),
      );
    },

    async getClassById(classId: string) {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .eq("id", classId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return null;
      }

      const row = data as ClassRow;
      const assignmentRows = await listAssignmentRowsForClass(row.id);
      const objectives = await getObjectivesForAssignmentIds(assignmentRows.map((assignment) => assignment.id));

      return mapClassRow(
        row,
        assignmentRows.map((assignment) => assignment.id),
        objectives.map((objective) => objective.id),
      );
    },

    async getAssignmentsForClass(classId: string) {
      const assignmentRows = await listAssignmentRowsForClass(classId);
      const assignmentObjectiveRows = await listAssignmentObjectiveRows(
        assignmentRows.map((assignment) => assignment.id),
      );
      const objectiveIdsByAssignment = buildObjectiveIdsByAssignment(assignmentObjectiveRows);

      return assignmentRows.map((row) =>
        mapAssignmentRow(row, objectiveIdsByAssignment.get(row.id) ?? []),
      );
    },

    async getLearningObjectivesByClass(classId: string) {
      return getLearningObjectivesByClass(classId);
    },

    async getAssignmentById(assignmentId: string) {
      const { data, error } = await supabase
        .from("assignments")
        .select("*")
        .eq("id", assignmentId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return null;
      }

      const row = data as AssignmentRow;
      const assignmentObjectiveRows = await listAssignmentObjectiveRows([row.id]);
      const objectiveIdsByAssignment = buildObjectiveIdsByAssignment(assignmentObjectiveRows);

      return mapAssignmentRow(row, objectiveIdsByAssignment.get(row.id) ?? []);
    },

    async getObjectives() {
      const { data, error } = await supabase
        .from("learning_objectives")
        .select("*")
        .order("title");

      if (error) {
        throw error;
      }

      return (data as LearningObjectiveRow[]).map(mapObjectiveRow);
    },

    async getObjectivesByIds(ids: string[]) {
      if (ids.length === 0) {
        return [];
      }

      const { data, error } = await supabase
        .from("learning_objectives")
        .select("*")
        .in("id", ids)
        .order("title");

      if (error) {
        throw error;
      }

      return (data as LearningObjectiveRow[]).map(mapObjectiveRow);
    },

    async getStudentsByIds(_ids: string[]): Promise<Student[]> {
      return [];
    },

    async getSubmissionsForAssignment(_assignmentId: string): Promise<StudentSubmission[]> {
      return [];
    },
  };
}

export async function getLearningObjectivesByClass(classId: string): Promise<LearningObjective[]> {
  const assignmentRows = await listAssignmentRowsForClass(classId);
  return getObjectivesForAssignmentIds(assignmentRows.map((assignment) => assignment.id));
}
