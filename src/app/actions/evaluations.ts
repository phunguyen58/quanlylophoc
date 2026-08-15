"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { verifyClassAccess } from "@/lib/classes/access";

const entrySchema = z.object({ student_id: z.string().uuid(), level: z.string().trim().max(60), comment: z.string().trim().max(1000) });
const saveSchema = z.object({ week: z.coerce.number().int().min(1).max(35), entries: z.array(entrySchema) });

export async function saveWeeklyEvaluations(classId: string, week: number, entries: z.infer<typeof entrySchema>[]) {
  const access = await verifyClassAccess(classId);
  if (!access.ok) return { error: access.error };
  const parsed = saveSchema.safeParse({ week, entries });
  if (!parsed.success) return { error: "Dữ liệu đánh giá chưa hợp lệ." };
  const rows = parsed.data.entries.filter((e) => e.level || e.comment).map((e) => ({ class_id: access.classId, student_id: e.student_id, week_number: parsed.data.week, level: e.level, comment: e.comment }));
  if (rows.length) {
    const { error } = await access.supabase.from("weekly_evaluations").upsert(rows, { onConflict: "student_id,week_number" });
    if (error) return { error: "Chưa thể lưu đánh giá. Vui lòng thử lại." };
  }
  revalidatePath(`/classes/${access.classId}/weekly`);
  revalidatePath(`/classes/${access.classId}`);
  return { success: "Đã lưu đánh giá tuần." };
}
