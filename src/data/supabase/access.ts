import { listAssignmentsForClass } from "@/data/supabase/assignments";
import { listClasses } from "@/data/supabase/classes";
import { listLearningObjectives } from "@/data/supabase/objectives";
import { createPattern } from "@/data/supabase/patterns";
import type { AnalysisPattern, Assignment, ClassRoom, LearningObjective } from "@/types/domain";
import type { Database } from "@/types/supabase";

type ErrorPatternInsert = Database["public"]["Tables"]["error_patterns"]["Insert"];

export async function getClasses(): Promise<ClassRoom[]> {
  return listClasses();
}

export async function getAssignments(classId: string): Promise<Assignment[]> {
  return listAssignmentsForClass(classId);
}

export async function getObjectives(): Promise<LearningObjective[]> {
  return listLearningObjectives();
}

export async function saveErrorPatterns(patterns: ErrorPatternInsert[]): Promise<AnalysisPattern[]> {
  return Promise.all(patterns.map((pattern) => createPattern(pattern)));
}
