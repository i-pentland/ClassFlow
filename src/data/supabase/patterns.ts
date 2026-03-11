import { supabase } from "@/lib/supabase/client";
import { mapPatternRowToDomain } from "@/lib/supabase/mappers";
import type { AnalysisPattern } from "@/types/domain";
import type { Database } from "@/types/supabase";

type PatternRow = Database["public"]["Tables"]["error_patterns"]["Row"];
type PatternInsert = Database["public"]["Tables"]["error_patterns"]["Insert"];
type PatternUpdate = Database["public"]["Tables"]["error_patterns"]["Update"];

export async function listPatternsForAssignment(assignmentId: string): Promise<AnalysisPattern[]> {
  const { data, error } = await supabase
    .from("error_patterns")
    .select("*")
    .eq("assignment_id", assignmentId)
    .is("dismissed_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data as PatternRow[]).map(mapPatternRowToDomain);
}

export async function createPattern(payload: PatternInsert): Promise<AnalysisPattern> {
  const { data, error } = await supabase.from("error_patterns").insert(payload).select("*").single();

  if (error) {
    throw error;
  }

  return mapPatternRowToDomain(data as PatternRow);
}

export async function updatePattern(patternId: string, payload: PatternUpdate): Promise<AnalysisPattern> {
  const { data, error } = await supabase.from("error_patterns").update(payload).eq("id", patternId).select("*").single();

  if (error) {
    throw error;
  }

  return mapPatternRowToDomain(data as PatternRow);
}

export async function dismissPattern(patternId: string): Promise<AnalysisPattern> {
  return updatePattern(patternId, {
    dismissed_at: new Date().toISOString(),
  });
}
