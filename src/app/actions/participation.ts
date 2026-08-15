"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { verifyClassAccess } from "@/lib/classes/access";

const requestIdSchema = z.string().uuid();
const eventIdSchema = z.string().uuid();

export type ParticipationActionResult =
  | { ok: true; eventId: string }
  | { ok: false; error: string };

export type UndoActionResult = { ok: true } | { ok: false; error: string };

export async function recordParticipation(
  classId: string,
  studentId: string,
  requestId: string,
  points: 1 | -1 = 1,
): Promise<ParticipationActionResult> {
  const access = await verifyClassAccess(classId);
  if (!access.ok) return { ok: false, error: access.error };

  const parsedRequestId = requestIdSchema.safeParse(requestId);
  if (!parsedRequestId.success) {
    return { ok: false, error: "Không thể ghi nhận phát biểu. Vui lòng thử lại." };
  }

  if (points !== 1 && points !== -1) {
    return { ok: false, error: "Không thể ghi nhận phát biểu. Vui lòng thử lại." };
  }

  const { data, error } = await access.supabase.rpc("record_participation", {
    p_class_id: access.classId,
    p_student_id: studentId,
    p_request_id: parsedRequestId.data,
    p_points: points,
  });

  if (error || !data?.id) {
    return { ok: false, error: "Không thể ghi nhận phát biểu. Vui lòng thử lại." };
  }

  revalidatePath(`/classes/${access.classId}/session`);
  revalidatePath(`/classes/${access.classId}/participation`);
  revalidatePath(`/classes/${access.classId}/students/${studentId}`);
  return { ok: true, eventId: data.id as string };
}

export async function undoParticipation(
  classId: string,
  eventId: string,
  studentId: string,
): Promise<UndoActionResult> {
  const access = await verifyClassAccess(classId);
  if (!access.ok) return { ok: false, error: access.error };

  const parsedEventId = eventIdSchema.safeParse(eventId);
  if (!parsedEventId.success) {
    return { ok: false, error: "Không thể hoàn tác. Vui lòng thử lại." };
  }

  const { error } = await access.supabase.rpc("undo_participation_event", {
    p_class_id: access.classId,
    p_event_id: parsedEventId.data,
  });

  if (error) {
    return { ok: false, error: "Không thể hoàn tác. Vui lòng thử lại." };
  }

  revalidatePath(`/classes/${access.classId}/session`);
  revalidatePath(`/classes/${access.classId}/participation`);
  revalidatePath(`/classes/${access.classId}/students/${studentId}`);
  return { ok: true };
}
