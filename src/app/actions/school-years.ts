"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { mapDatabaseError } from "@/lib/supabase/errors";
import { ensureTeacherProfile } from "@/lib/supabase/profile";
import { schoolYearNameSchema } from "@/lib/school-years";

export type SchoolYearState = { error?: string; success?: string };

export async function ensureSchoolYear(
  name: string,
): Promise<{ id?: string; error?: string }> {
  const parsed = schoolYearNameSchema.safeParse(name);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Năm học chưa hợp lệ." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return { error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." };

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
    return {
      error: mapDatabaseError(error, "Chưa thể tạo năm học. Vui lòng thử lại."),
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/class-management");
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
  if (!user)
    return { error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." };

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
  revalidatePath("/class-management");
  revalidatePath("/", "layout");
  return { success: "Đã thêm năm học." };
}

const deleteYearSchema = z.string().uuid();

export async function deleteSchoolYear(
  schoolYearId: string,
): Promise<SchoolYearState> {
  const parsed = deleteYearSchema.safeParse(schoolYearId);
  if (!parsed.success) return { error: "Năm học không hợp lệ." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return { error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." };

  const { data: existing } = await supabase
    .from("school_years")
    .select("id, name")
    .eq("id", parsed.data)
    .eq("teacher_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!existing)
    return { error: "Không tìm thấy năm học hoặc bạn không có quyền xóa." };

  const { count, error: countError } = await supabase
    .from("classes")
    .select("id", { count: "exact", head: true })
    .eq("teacher_id", user.id)
    .or(`school_year_id.eq.${parsed.data},school_year.eq.${existing.name}`)
    .is("deleted_at", null);

  if (countError) {
    return {
      error: mapDatabaseError(
        countError,
        "Chưa thể kiểm tra danh sách lớp. Vui lòng thử lại.",
      ),
    };
  }

  if ((count ?? 0) > 0) {
    return {
      error: "Cần xóa hết các lớp trong năm học trước khi xóa năm học.",
    };
  }

  const { error } = await supabase
    .from("school_years")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data)
    .eq("teacher_id", user.id)
    .is("deleted_at", null);

  if (error)
    return {
      error: mapDatabaseError(error, "Chưa thể xóa năm học. Vui lòng thử lại."),
    };

  revalidatePath("/dashboard");
  revalidatePath("/class-management");
  revalidatePath("/", "layout");
  return { success: "Đã xóa năm học." };
}
