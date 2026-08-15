"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ensureSchoolYear } from "@/app/actions/school-years";
import { createClient } from "@/lib/supabase/server";
import { mapDatabaseError } from "@/lib/supabase/errors";
import { ensureTeacherProfile } from "@/lib/supabase/profile";
import { schoolYearNameSchema } from "@/lib/school-years";

export type CreateClassState = { error?: string };

const classSchema = z.object({
  name: z.string().trim().min(1, "Nhập tên lớp.").max(60),
  schoolYear: schoolYearNameSchema,
  grade: z.coerce.number().int().min(1).max(12),
});

export async function createClass(_: CreateClassState, formData: FormData): Promise<CreateClassState> {
  const parsed = classSchema.safeParse({
    name: formData.get("name"),
    schoolYear: formData.get("schoolYear"),
    grade: formData.get("grade"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Thông tin lớp chưa hợp lệ." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." };

  const profileResult = await ensureTeacherProfile(supabase, user);
  if (profileResult.error) {
    return {
      error: "Chưa thể thiết lập hồ sơ giáo viên. Vui lòng chạy lại SQL setup trong Supabase.",
    };
  }

  const yearResult = await ensureSchoolYear(parsed.data.schoolYear);
  if (yearResult.error || !yearResult.id) {
    return { error: yearResult.error ?? "Chưa thể gắn năm học cho lớp." };
  }

  const { error } = await supabase.from("classes").insert({
    grade: parsed.data.grade,
    name: parsed.data.name,
    school_year: parsed.data.schoolYear,
    school_year_id: yearResult.id,
    teacher_id: user.id,
  });

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Lớp này đã tồn tại trong năm học đã chọn."
          : mapDatabaseError(error, "Chưa thể tạo lớp. Vui lòng thử lại."),
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export type ClassMutationState = { error?: string; success?: string };

const updateClassSchema = z.object({
  classId: z.string().uuid(),
  name: z.string().trim().min(1, "Nhập tên lớp.").max(60),
  grade: z.coerce.number().int().min(1).max(12),
});

export async function updateClass(
  _: ClassMutationState,
  formData: FormData,
): Promise<ClassMutationState> {
  const parsed = updateClassSchema.safeParse({
    classId: formData.get("classId"),
    name: formData.get("name"),
    grade: formData.get("grade"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Thông tin lớp chưa hợp lệ." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." };

  const { error } = await supabase
    .from("classes")
    .update({ name: parsed.data.name, grade: parsed.data.grade })
    .eq("id", parsed.data.classId)
    .eq("teacher_id", user.id)
    .is("deleted_at", null);

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Tên lớp đã tồn tại trong năm học này."
          : mapDatabaseError(error, "Chưa thể sửa lớp. Vui lòng thử lại."),
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  revalidatePath(`/classes/${parsed.data.classId}`);
  return { success: "Đã cập nhật lớp." };
}

export async function softDeleteClass(classId: string): Promise<ClassMutationState> {
  const id = z.string().uuid().safeParse(classId);
  if (!id.success) return { error: "Lớp không hợp lệ." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." };

  const { data: existing } = await supabase
    .from("classes")
    .select("id, name")
    .eq("id", id.data)
    .eq("teacher_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!existing) return { error: "Không tìm thấy lớp hoặc bạn không có quyền xóa." };

  const { error } = await supabase
    .from("classes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id.data)
    .eq("teacher_id", user.id)
    .is("deleted_at", null);

  if (error) return { error: "Chưa thể xóa lớp. Vui lòng thử lại." };

  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
