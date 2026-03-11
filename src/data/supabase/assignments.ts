import { supabase } from "@/lib/supabase/client";
import { mapAssignmentRowToDomain } from "@/lib/supabase/mappers";
import type { Assignment } from "@/types/domain";
import type { Database } from "@/types/supabase";

type AssignmentRow = Database["public"]["Tables"]["assignments"]["Row"];
type AssignmentObjectiveRow = Pick<
  Database["public"]["Tables"]["assignment_objectives"]["Row"],
  "assignment_id" | "objective_id"
>;
type AssignmentInsert = Database["public"]["Tables"]["assignments"]["Insert"];
type AssignmentUpdate = Database["public"]["Tables"]["assignments"]["Update"];

async function getObjectiveIdsByAssignmentIds(assignmentIds: string[]): Promise<Map<string, string[]>> {
  if (assignmentIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("assignment_objectives")
    .select("assignment_id, objective_id")
    .in("assignment_id", assignmentIds);

  if (error) {
    throw error;
  }

  const mapping = new Map<string, string[]>();

  for (const row of data as AssignmentObjectiveRow[]) {
    const objectiveIds = mapping.get(row.assignment_id) ?? [];
    objectiveIds.push(row.objective_id);
    mapping.set(row.assignment_id, objectiveIds);
  }

  return mapping;
}

export async function listAssignmentsForClass(classId: string): Promise<Assignment[]> {
  const { data, error } = await supabase.from("assignments").select("*").eq("class_id", classId).order("due_date", { ascending: false });

  if (error) {
    throw error;
  }

  const assignmentRows = data as AssignmentRow[];
  const objectiveIdsByAssignmentId = await getObjectiveIdsByAssignmentIds(assignmentRows.map((row) => row.id));

  return assignmentRows.map((row) => mapAssignmentRowToDomain(row, objectiveIdsByAssignmentId.get(row.id) ?? []));
}

export async function getAssignmentById(assignmentId: string): Promise<Assignment | null> {
  const { data, error } = await supabase.from("assignments").select("*").eq("id", assignmentId).maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const assignmentRow = data as AssignmentRow;
  const objectiveIdsByAssignmentId = await getObjectiveIdsByAssignmentIds([assignmentRow.id]);

  return mapAssignmentRowToDomain(assignmentRow, objectiveIdsByAssignmentId.get(assignmentRow.id) ?? []);
}

export async function createAssignment(payload: AssignmentInsert): Promise<Assignment> {
  const { data, error } = await supabase.from("assignments").insert(payload).select("*").single();

  if (error) {
    throw error;
  }

  return mapAssignmentRowToDomain(data as AssignmentRow);
}

export async function updateAssignment(assignmentId: string, payload: AssignmentUpdate): Promise<Assignment> {
  const { data, error } = await supabase.from("assignments").update(payload).eq("id", assignmentId).select("*").single();

  if (error) {
    throw error;
  }

  const assignmentRow = data as AssignmentRow;
  const objectiveIdsByAssignmentId = await getObjectiveIdsByAssignmentIds([assignmentRow.id]);

  return mapAssignmentRowToDomain(assignmentRow, objectiveIdsByAssignmentId.get(assignmentRow.id) ?? []);
}
