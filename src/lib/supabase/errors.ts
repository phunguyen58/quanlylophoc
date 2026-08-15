/** User-facing message when Supabase tables are missing (migrations not applied). */
export const SETUP_REQUIRED_MESSAGE =
  "Cơ sở dữ liệu chưa được thiết lập. Vui lòng chạy migrations trong Supabase (xem README.md).";

export function isDatabaseSetupError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "PGRST205") return true;
  return /could not find the table/i.test(error.message ?? "");
}

export function mapDatabaseError(error: { code?: string; message?: string } | null, fallback: string): string {
  if (isDatabaseSetupError(error)) return SETUP_REQUIRED_MESSAGE;
  if (error?.code === "42501") {
    return "Bạn chưa có quyền tạo lớp. Vui lòng kiểm tra đã chạy đầy đủ migrations RLS và profile_backfill trong Supabase.";
  }
  if (error?.code === "23503") {
    return "Hồ sơ giáo viên chưa sẵn sàng. Vui lòng chạy migration profile_backfill hoặc đăng nhập lại.";
  }
  if (error?.code === "23514") {
    return "Thông tin lớp chưa đúng định dạng. Năm học cần có dạng 2026-2027 và khối từ 1 đến 12.";
  }
  return fallback;
}
