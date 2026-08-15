"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { verifyClassAccess } from "@/lib/classes/access";
import { isPointValue, resolvePointReason } from "@/lib/points/format";
import type { PointValue } from "@/types/points";

const requestIdSchema = z.string().uuid();
const eventIdSchema = z.string().uuid();

export type PointActionResult =
  | { ok: true; eventId: string; points: number; reason: string }
  | { ok: false; error: string };

export type UndoPointResult = { ok: true } | { ok: false; error: string };

export async function recordStudentPoints(
  classId: string,
  studentId: string,
  points: number,
  requestId: string,
  customReason?: string,
): Promise<PointActionResult> {
  const access = await verifyClassAccess(classId);
  if (!access.ok) return { ok: false, error: access.error };

  if (!isPointValue(points)) {
    return { ok: false, error: "Mức điểm không hợp lệ." };
  }

  const parsedRequestId = requestIdSchema.safeParse(requestId);
  if (!parsedRequestId.success) {
    return { ok: false, error: "Không thể ghi nhận điểm. Vui lòng thử lại." };
  }

  const reason = resolvePointReason(points as PointValue, customReason);
  if (!reason.trim()) {
    return { ok: false, error: "Cần có lý do khi ghi nhận điểm." };
  }

  const { data, error } = await access.supabase.rpc("record_student_points", {
    p_class_id: access.classId,
    p_student_id: studentId,
    p_points: points,
    p_reason: reason,
    p_request_id: parsedRequestId.data,
  });

  if (error || !data?.id) {
    return { ok: false, error: "Không thể ghi nhận điểm. Vui lòng thử lại." };
  }

  revalidatePath(`/classes/${access.classId}/students`);
  revalidatePath(`/classes/${access.classId}/students/${studentId}`);
  return {
    ok: true,
    eventId: data.id as string,
    points,
    reason,
  };
}

export async function undoStudentPoints(
  classId: string,
  eventId: string,
  studentId: string,
): Promise<UndoPointResult> {
  const access = await verifyClassAccess(classId);
  if (!access.ok) return { ok: false, error: access.error };

  const parsedEventId = eventIdSchema.safeParse(eventId);
  if (!parsedEventId.success) {
    return { ok: false, error: "Không thể hoàn tác. Vui lòng thử lại." };
  }

  const { error } = await access.supabase.rpc("undo_student_points_event", {
    p_class_id: access.classId,
    p_event_id: parsedEventId.data,
  });

  if (error) {
    return { ok: false, error: "Không thể hoàn tác. Vui lòng thử lại." };
  }

  revalidatePath(`/classes/${access.classId}/students`);
  revalidatePath(`/classes/${access.classId}/students/${studentId}`);
  return { ok: true };
}
