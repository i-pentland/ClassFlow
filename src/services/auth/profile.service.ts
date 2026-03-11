import type { User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

export async function upsertTeacherProfile(user: User) {
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? null,
      full_name: typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : null,
    },
    {
      onConflict: "id",
    },
  );

  if (error) {
    throw error;
  }
}
