import { supabase } from "@/lib/supabase/client";
import { mapObjectiveRowToDomain } from "@/lib/supabase/mappers";
import type { LearningObjective } from "@/types/domain";
import type { Database } from "@/types/supabase";

type ObjectiveRow = Database["public"]["Tables"]["learning_objectives"]["Row"];
type ObjectiveInsert = Database["public"]["Tables"]["learning_objectives"]["Insert"];
type ObjectiveUpdate = Database["public"]["Tables"]["learning_objectives"]["Update"];

export async function listLearningObjectives(): Promise<LearningObjective[]> {
  const { data, error } = await supabase.from("learning_objectives").select("*").order("title");

  if (error) {
    throw error;
  }

  return (data as ObjectiveRow[]).map(mapObjectiveRowToDomain);
}

export async function getLearningObjectiveById(objectiveId: string): Promise<LearningObjective | null> {
  const { data, error } = await supabase
    .from("learning_objectives")
    .select("*")
    .eq("id", objectiveId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapObjectiveRowToDomain(data as ObjectiveRow) : null;
}

export async function createLearningObjective(payload: ObjectiveInsert): Promise<LearningObjective> {
  const { data, error } = await supabase
    .from("learning_objectives")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapObjectiveRowToDomain(data as ObjectiveRow);
}

export async function updateLearningObjective(
  objectiveId: string,
  payload: ObjectiveUpdate,
): Promise<LearningObjective> {
  const { data, error } = await supabase
    .from("learning_objectives")
    .update(payload)
    .eq("id", objectiveId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapObjectiveRowToDomain(data as ObjectiveRow);
}
