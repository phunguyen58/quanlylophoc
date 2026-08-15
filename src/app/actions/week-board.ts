"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { verifyClassAccess } from "@/lib/classes/access";
import { TOTAL_WEEKS } from "@/lib/weeks";
import type { AttendanceStatus } from "@/types/attendance";

const attendanceEntrySchema = z.object({
  student_id: z.string().uuid(),
  status: z.enum(["PRESENT", "ABSENT", "EXCUSED", "LATE"]),
  note: z.string().trim().max(500).default(""),
});

const evaluationEntrySchema = z.object({
  student_id: z.string().uuid(),
  level: z.string().trim().max(60),
  comment: z.string().trim().max(1000),
});

const saveSchema = z
  .object({
    week: z.coerce.number().int().min(1).max(TOTAL_WEEKS),
    startDate: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
    endDate: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
    attendance: z.array(attendanceEntrySchema),
    evaluations: z.array(evaluationEntrySchema),
  })
  .superRefine((value, ctx) => {
    if (value.startDate && value.endDate && value.startDate > value.endDate) {
      ctx.addIssue({
        code: "custom",
        message: "Từ ngày phải trước hoặc bằng Đến ngày.",
        path: ["endDate"],
      });
    }
  });

export type WeekBoardAttendanceInput = {
  student_id: string;
  status: AttendanceStatus;
  note?: string;
};

export type WeekBoardEvaluationInput = {
  student_id: string;
  level: string;
  comment: string;
};

export async function saveWeekBoard(
  classId: string,
  week: number,
  attendance: WeekBoardAttendanceInput[],
  evaluations: WeekBoardEvaluationInput[],
  dates?: { startDate?: string; endDate?: string },
) {
  const access = await verifyClassAccess(classId);
  if (!access.ok) return { error: access.error };

  const parsed = saveSchema.safeParse({
    week,
    startDate: dates?.startDate ?? "",
    endDate: dates?.endDate ?? "",
    attendance,
    evaluations,
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dữ liệu tuần chưa hợp lệ. Kiểm tra rồi thử lại.",
    };
  }

  const { error } = await access.supabase.rpc("save_week_board", {
    p_class_id: access.classId,
    p_week_number: parsed.data.week,
    p_attendance: parsed.data.attendance.map((row) => ({
      student_id: row.student_id,
      status: row.status,
      note: row.note ?? "",
    })),
    p_evaluations: parsed.data.evaluations,
  });

  if (error) {
    return { error: "Chưa thể lưu tuần học. Vui lòng thử lại." };
  }

  const { error: weekError } = await access.supabase.from("class_weeks").upsert(
    {
      class_id: access.classId,
      week_number: parsed.data.week,
      start_date: parsed.data.startDate || null,
      end_date: parsed.data.endDate || null,
    },
    { onConflict: "class_id,week_number" },
  );

  if (weekError) {
    return {
      error:
        "Đã lưu điểm danh/đánh giá nhưng chưa lưu được ngày tuần. Chạy file supabase/patch_class_weeks.sql rồi thử lại.",
    };
  }

  revalidatePath(`/classes/${access.classId}`);
  revalidatePath(`/classes/${access.classId}/weeks/${parsed.data.week}`);
  revalidatePath(`/classes/${access.classId}/weekly`);
  revalidatePath(`/classes/${access.classId}/students`);
  return { success: `Đã lưu tuần ${parsed.data.week}.` };
}
