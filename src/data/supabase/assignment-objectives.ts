import { supabase } from "@/lib/supabase/client";
import type { AssignmentObjectiveMapping } from "@/lib/supabase/mappers";
import type { Database } from "@/types/supabase";

type AssignmentObjectiveInsert = Database["public"]["Tables"]["assignment_objectives"]["Insert"];
type AssignmentObjectiveRow = AssignmentObjectiveMapping;

export async function listAssignmentObjectiveMappings(assignmentId?: string): Promise<AssignmentObjectiveMapping[]> {
  let query = supabase
    .from("assignment_objectives")
    .select("id, assignment_id, objective_id, teacher_id, created_at")
    .order("created_at", { ascending: true });

  if (assignmentId) {
    query = query.eq("assignment_id", assignmentId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data as AssignmentObjectiveRow[];
}

export async function createAssignmentObjectiveMapping(
  payload: AssignmentObjectiveInsert,
): Promise<AssignmentObjectiveMapping> {
  const { data, error } = await supabase
    .from("assignment_objectives")
    .insert(payload)
    .select("id, assignment_id, objective_id, teacher_id, created_at")
    .single();

  if (error) {
    throw error;
  }

  return data as AssignmentObjectiveRow;
}

export async function deleteAssignmentObjectiveMapping(assignmentId: string, objectiveId: string): Promise<void> {
  const { error } = await supabase
    .from("assignment_objectives")
    .delete()
    .eq("assignment_id", assignmentId)
    .eq("objective_id", objectiveId);

  if (error) {
    throw error;
  }
}
