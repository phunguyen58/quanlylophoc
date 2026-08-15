"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { mapDatabaseError } from "@/lib/supabase/errors";
import { ensureTeacherProfile } from "@/lib/supabase/profile";

export type CreateClassState = { error?: string };
const classSchema = z.object({ name: z.string().trim().min(1, "Nhập tên lớp.").max(60), schoolYear: z.string().regex(/^\d{4}-\d{4}$/, "Dùng định dạng năm học 2026-2027."), grade: z.coerce.number().int().min(1).max(12) });

export async function createClass(_: CreateClassState, formData: FormData): Promise<CreateClassState> {
  const parsed = classSchema.safeParse({ name: formData.get("name"), schoolYear: formData.get("schoolYear"), grade: formData.get("grade") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Thông tin lớp chưa hợp lệ." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." };

  const profileResult = await ensureTeacherProfile(supabase, user);
  if (profileResult.error) {
    return { error: "Chưa thể thiết lập hồ sơ giáo viên. Vui lòng chạy file migration profile_backfill trong Supabase." };
  }

  const { error } = await supabase.from("classes").insert({ grade: parsed.data.grade, name: parsed.data.name, school_year: parsed.data.schoolYear, teacher_id: user.id });
  if (error) return { error: error.code === "23505" ? "Lớp này đã tồn tại trong năm học đã chọn." : mapDatabaseError(error, "Chưa thể tạo lớp. Vui lòng thử lại.") };
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
