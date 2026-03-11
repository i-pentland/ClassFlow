import { supabase } from "@/lib/supabase/client";
import { mapClassRowToDomain } from "@/lib/supabase/mappers";
import type { ClassRoom } from "@/types/domain";
import type { Database } from "@/types/supabase";

type ClassRow = Database["public"]["Tables"]["classes"]["Row"];
type ClassInsert = Database["public"]["Tables"]["classes"]["Insert"];
type ClassUpdate = Database["public"]["Tables"]["classes"]["Update"];

export async function listClasses(): Promise<ClassRoom[]> {
  const { data, error } = await supabase.from("classes").select("*").order("title");

  if (error) {
    throw error;
  }

  return (data as ClassRow[]).map((row) => mapClassRowToDomain(row));
}

export async function getClassById(classId: string): Promise<ClassRoom | null> {
  const { data, error } = await supabase.from("classes").select("*").eq("id", classId).maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapClassRowToDomain(data as ClassRow) : null;
}

export async function createClass(payload: ClassInsert): Promise<ClassRoom> {
  const { data, error } = await supabase.from("classes").insert(payload).select("*").single();

  if (error) {
    throw error;
  }

  return mapClassRowToDomain(data as ClassRow);
}

export async function updateClass(classId: string, payload: ClassUpdate): Promise<ClassRoom> {
  const { data, error } = await supabase.from("classes").update(payload).eq("id", classId).select("*").single();

  if (error) {
    throw error;
  }

  return mapClassRowToDomain(data as ClassRow);
}
