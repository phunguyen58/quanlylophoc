# Hướng dẫn deploy QLLH

Checklist triển khai production với **Supabase** (database + auth) và **Vercel** (frontend).

---

## Phần 1: Supabase

### 1. Tạo project

1. Đăng nhập [supabase.com](https://supabase.com).
2. **New project** → chọn tổ chức, tên, mật khẩu database, region (gần người dùng, ví dụ Singapore).
3. Chờ project khở tạo xong.

### 2. Chạy SQL setup (một file duy nhất)

Trong **SQL Editor**, mở file repo:

`supabase/complete_setup.sql`

Copy **toàn bộ** nội dung → dán → **Run**.

File này gồm: reset schema ứng dụng + tạo bảng (năm học, lớp, học sinh, điểm danh tuần/ngày, đánh giá, điểm HK/cuối năm) + RLS + RPC.

> Cảnh báo: `complete_setup.sql` **xóa dữ liệu ứng dụng** rồi tạo lại. Chỉ dùng cho project mới hoặc khi cố ý reset. Không chạy trên dữ liệu học sinh thật.

Seed demo (tuỳ chọn, file riêng): `supabase/seed.demo.sql`.
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
