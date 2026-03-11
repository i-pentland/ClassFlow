import { supabase } from "@/lib/supabase/client";
import type { AnalysisRunRecord } from "@/lib/supabase/mappers";
import type { Database } from "@/types/supabase";

type AnalysisRunRow = Database["public"]["Tables"]["analysis_runs"]["Row"];
type AnalysisRunInsert = Database["public"]["Tables"]["analysis_runs"]["Insert"];
type AnalysisRunUpdate = Database["public"]["Tables"]["analysis_runs"]["Update"];

export async function listAnalysisRuns(assignmentId?: string): Promise<AnalysisRunRecord[]> {
  let query = supabase
    .from("analysis_runs")
    .select("*")
    .order("created_at", { ascending: false });

  if (assignmentId) {
    query = query.eq("assignment_id", assignmentId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data as AnalysisRunRow[];
}

export async function createAnalysisRun(payload: AnalysisRunInsert): Promise<AnalysisRunRecord> {
  const { data, error } = await supabase.from("analysis_runs").insert(payload).select("*").single();

  if (error) {
    throw error;
  }

  return data as AnalysisRunRow;
}

export async function updateAnalysisRun(
  analysisRunId: string,
  payload: AnalysisRunUpdate,
): Promise<AnalysisRunRecord> {
  const { data, error } = await supabase
    .from("analysis_runs")
    .update(payload)
    .eq("id", analysisRunId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as AnalysisRunRow;
}
