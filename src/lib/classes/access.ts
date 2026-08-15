import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const classIdSchema = z.string().uuid();

export type ClassAccessResult =
  | { ok: false; error: string }
  | {
      ok: true;
      supabase: Awaited<ReturnType<typeof createClient>>;
      classId: string;
      className: string;
    };

async function getAuthenticatedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      user: null as null,
      error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    };
  }

  return { supabase, user, error: undefined };
}

export async function verifyClassAccess(classId: string): Promise<ClassAccessResult> {
  const parsedClassId = classIdSchema.safeParse(classId);
  if (!parsedClassId.success) {
    return { ok: false, error: "Lớp không hợp lệ." };
  }

  const auth = await getAuthenticatedClient();
  if (auth.error) return { ok: false, error: auth.error };

  const { data: classItem } = await auth.supabase
    .from("classes")
    .select("id, name")
    .eq("id", parsedClassId.data)
    .is("deleted_at", null)
    .maybeSingle();

  if (!classItem) {
    return { ok: false, error: "Không tìm thấy lớp hoặc bạn không có quyền truy cập." };
  }

  return {
    ok: true,
    supabase: auth.supabase,
    classId: parsedClassId.data,
    className: classItem.name,
  };
}
