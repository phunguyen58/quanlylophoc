"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { mapDatabaseError } from "@/lib/supabase/errors";
import { ensureTeacherProfile } from "@/lib/supabase/profile";
import { schoolYearNameSchema } from "@/lib/school-years";

export type SchoolYearState = { error?: string; success?: string };

export async function ensureSchoolYear(name: string): Promise<{ id?: string; error?: string }> {
  const parsed = schoolYearNameSchema.safeParse(name);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Năm học chưa hợp lệ." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." };

  const profileResult = await ensureTeacherProfile(supabase, user);
  if (profileResult.error) {
    return { error: "Chưa thể thiết lập hồ sơ giáo viên. Vui lòng thử lại." };
  }

  const { data: existing } = await supabase
    .from("school_years")
    .select("id")
    .eq("teacher_id", user.id)
    .eq("name", parsed.data)
    .is("deleted_at", null)
    .maybeSingle();

  if (existing?.id) return { id: existing.id };

  const { data: created, error } = await supabase
    .from("school_years")
    .insert({ name: parsed.data, teacher_id: user.id })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: again } = await supabase
        .from("school_years")
        .select("id")
        .eq("teacher_id", user.id)
        .eq("name", parsed.data)
        .is("deleted_at", null)
        .maybeSingle();
      if (again?.id) return { id: again.id };
      return { error: "Năm học này đã tồn tại." };
    }
    return { error: mapDatabaseError(error, "Chưa thể tạo năm học. Vui lòng thử lại.") };
  }

  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  return { id: created.id };
}

const createYearSchema = z.object({
  name: schoolYearNameSchema,
});

export async function createSchoolYear(
  _: SchoolYearState,
  formData: FormData,
): Promise<SchoolYearState> {
  const parsed = createYearSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Năm học chưa hợp lệ." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." };

  const { data: existing } = await supabase
    .from("school_years")
    .select("id")
    .eq("teacher_id", user.id)
    .eq("name", parsed.data.name)
    .is("deleted_at", null)
    .maybeSingle();

  if (existing?.id) {
    return { error: "Năm học này đã có rồi. Chọn năm khác." };
  }

  const result = await ensureSchoolYear(parsed.data.name);
  if (result.error) return { error: result.error };

  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  return { success: "Đã thêm năm học." };
}
