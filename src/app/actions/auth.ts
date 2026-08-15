"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ensureTeacherProfile } from "@/lib/supabase/profile";

export type LoginState = { error?: string };

const loginSchema = z.object({
  email: z.email("Nhập địa chỉ email hợp lệ."),
  password: z.string().min(1, "Nhập mật khẩu để tiếp tục."),
  next: z
    .string()
    .refine((value) => value.startsWith("/") && !value.startsWith("//"), "Đường dẫn quay lại không hợp lệ.")
    .optional(),
});

export async function login(_: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu đăng nhập không hợp lệ." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) return { error: "Email hoặc mật khẩu chưa đúng. Vui lòng thử lại." };

  const { data: { user } } = await supabase.auth.getUser();
  if (user) await ensureTeacherProfile(supabase, user);

  redirect(parsed.data.next && parsed.data.next !== "/login" ? parsed.data.next : "/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
