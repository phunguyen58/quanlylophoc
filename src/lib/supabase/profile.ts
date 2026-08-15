import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

function resolveFullName(user: User): string {
  const fromMetadata = user.user_metadata?.full_name;
  if (typeof fromMetadata === "string" && fromMetadata.trim()) return fromMetadata.trim();
  const emailPrefix = user.email?.split("@")[0]?.trim();
  if (emailPrefix) return emailPrefix;
  return "Giáo viên";
}

/** Ensures auth.users has a matching profiles row (required before creating classes). */
export async function ensureTeacherProfile(
  supabase: SupabaseClient,
  user: User,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("profiles").upsert(
    { id: user.id, full_name: resolveFullName(user) },
    { onConflict: "id" },
  );

  return { error: error?.message ?? null };
}
