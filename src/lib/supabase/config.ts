export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !publishableKey) {
    throw new Error("Supabase chưa được cấu hình. Kiểm tra biến môi trường của ứng dụng.");
  }

  return { publishableKey, url };
}
