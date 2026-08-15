# Hướng dẫn deploy QLLH

Checklist triển khai production với **Supabase** (database + auth) và **Vercel** (frontend).

---

## Phần 1: Supabase

### 1. Tạo project

1. Đăng nhập [supabase.com](https://supabase.com).
2. **New project** → chọn tổ chức, tên, mật khẩu database, region (gần người dùng, ví dụ Singapore).
3. Chờ project khở tạo xong.

### 2. Chạy migrations

Trong **SQL Editor**, chạy lần lượt **toàn bộ nội dung** từng file (theo thứ tự tên):

| File | Nội dung |
|------|----------|
| `202608120001_initial_schema.sql` | Bảng, enum, index, trigger |
| `202608120002_rls_and_rpc.sql` | RLS + RPC điểm danh/phát biểu/điểm |
| `202608120003_import_students_rpc.sql` | RPC import học sinh |
| `202608120004_undo_participation_rpc.sql` | RPC hoàn tác phát biểu |
| `202608120005_undo_student_points_rpc.sql` | RPC hoàn tác điểm |
| `202608120006_profile_backfill.sql` | Bổ sung profile cho tài khoản cũ |
| `202608120007_safe_undo_events.sql` | Hoàn tác bằng event bù trừ, giữ lịch sử |

Hoặc dùng Supabase CLI (nếu đã link project):

```bash
supabase db push
```

Để áp dụng bằng **một lần chạy trong Supabase SQL Editor**, mở `supabase/complete_setup.sql`, copy toàn bộ nội dung và bấm **Run**. File này chứa toàn bộ migrations theo đúng thứ tự và dành cho project chưa được thiết lập.

```bash
psql "$DATABASE_URL" -f supabase/complete_setup.sql
```

### 3. Cấu hình Authentication

1. **Authentication** → **Providers** → bật **Email**.
2. Tắt **Confirm email** nếu muốn giáo viên đăng nhập ngay (MVP nội bộ). Production công khai nên bật xác nhận email.
3. **Authentication** → **URL Configuration**:
   - **Site URL:** `https://your-app.vercel.app` (URL production)
   - **Redirect URLs:** thêm:
     - `https://your-app.vercel.app/**`
     - `http://localhost:3000/**` (dev)

### 4. Tạo giáo viên đầu tiên

**Authentication** → **Users** → **Add user** → email + mật khẩu.

Trigger `handle_new_user` tự tạo bản ghi `profiles`.

### 5. Lấy API keys

**Project Settings** → **API**:

| Key | Dùng ở đâu |
|-----|------------|
| **Project URL** | `NEXT_PUBLIC_SUPABASE_URL` |
| **anon / publishable key** | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **service_role key** | **KHÔNG** dùng trong Vercel frontend |

> Cảnh báo: `service_role` bỏ qua RLS. Chỉ dùng trên server tin cậy, không commit, không prefix `NEXT_PUBLIC_`.

---

## Phần 2: Vercel

### 1. Kết nối GitHub

1. Đăng nhập [vercel.com](https://vercel.com).
2. **Add New** → **Project** → import repo `quanlylophoc`.
3. Framework: **Next.js** (tự nhận diện).

### 2. Environment Variables

Trong **Settings** → **Environment Variables**, thêm cho **Production** (và Preview nếu cần):

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL từ Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key từ Supabase |

Không thêm `SUPABASE_SERVICE_ROLE_KEY` trừ khi có backend riêng (ứng dụng này không cần).

### 3. Deploy

Nhấn **Deploy**. Vercel chạy `npm run build` tự động.

### 4. Cập nhật Supabase redirect

Sau khi có URL Vercel (`https://xxx.vercel.app`), quay lại Supabase → **URL Configuration** và cập nhật **Site URL** + **Redirect URLs** như mục 1.3.

### 5. Kiểm tra sau deploy

- [ ] Đăng nhập `/login` thành công
- [ ] Tạo lớp trên `/dashboard`
- [ ] Thêm học sinh, điểm danh, phát biểu, chấm điểm
- [ ] Đăng xuất / đăng nhập lại
- [ ] Thử truy cập `/classes/<id-lớp-khác>` bằng tài khoản giáo viên khác → phải bị từ chối (404 / không có dữ liệu)

---

## Biến môi trường local vs production

| Biến | Local (`.env.local`) | Vercel |
|------|----------------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase | Giống |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key | Giống |

Có thể dùng cùng một Supabase project cho dev và production khi thử nghiệm, hoặc tách project riêng cho production.

---

## Rollback migrations

Không chạy `DROP` tùy tiện trên production. Nếu migration lỗi:

1. Sửa migration trong repo.
2. Viết migration bổ sung (forward-only) thay vì sửa file đã chạy.
3. Test trên project Supabase staging trước.

---

## Giám sát (tuỳ chọn)

- Supabase Dashboard → **Logs** / **Database** → theo dõi lỗi RPC.
- Vercel → **Deployments** → **Functions** logs nếu Server Actions lỗi.

Không log dữ liệu học sinh (tên, mã HS) ra console production.
