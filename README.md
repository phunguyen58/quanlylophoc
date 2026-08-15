# QLLH

Ứng dụng web mobile-first giúp giáo viên tiểu học quản lý lớp: học sinh, điểm danh, phát biểu, điểm thi đua và báo cáo.

Giao diện bằng tiếng Việt, thiết kế cho điện thoại và máy tính bảng.

---

## Yêu cầu

- Node.js 20+
- Tài khoản [Supabase](https://supabase.com) (miễn phí)
- npm

---

## Chạy trên máy tính (dành cho người cài đặt)

### 1. Tải mã nguồn và cài package

```bash
git clone <url-repo>
cd quanlylophoc
npm install
```

### 2. Cấu hình biến môi trường

```bash
cp .env.example .env.local
```

Mở `.env.local` và điền:

| Biến | Mô tả |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon / publishable key (an toàn cho trình duyệt) |

> **Quan trọng:** Không bao giờ đặt `SUPABASE_SERVICE_ROLE_KEY` vào biến `NEXT_PUBLIC_*` hoặc mã chạy trên trình duyệt.

### 3. Thiết lập Supabase

Xem chi tiết trong [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

Tóm tắt:

1. Tạo project Supabase.
2. Chạy lần lượt các file trong `supabase/migrations/` (theo thứ tự tên file) bằng SQL Editor hoặc Supabase CLI.
3. Bật Email auth trong Supabase Dashboard → Authentication.
4. Tạo tài khoản giáo viên (xem bên dưới).

### 4. Chạy ứng dụng

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

### 5. Kiểm tra chất lượng

```bash
npm run lint
npm run typecheck
npm run build
```

---

## Tạo tài khoản giáo viên

1. Vào Supabase Dashboard → **Authentication** → **Users**.
2. Chọn **Add user** → **Create new user**.
3. Nhập email và mật khẩu.
4. Hệ thống tự tạo hồ sơ (`profiles`) khi đăng nhập lần đầu.

Giáo viên đăng nhập tại `/login`.

---

## Hướng dẫn sử dụng (dành cho giáo viên)

### Tạo lớp

1. Đăng nhập → **Trang chủ**.
2. Nhấn **+ Tạo lớp**.
3. Nhập tên lớp (ví dụ: 4A1), năm học (2026-2027), khối (1–12).
4. Nhấn **Lưu lớp**.

### Thêm / import học sinh

1. Mở lớp → **Học sinh**.
2. **Thêm học sinh** — nhập từng em.
3. **Import Excel** — tải file mẫu, điền danh sách, tải lên và xác nhận.
   - Tối đa 200 học sinh / file, dung lượng tối đa 2 MB.
   - File phải có cột `student_code` và `full_name`.

### Điểm danh

1. Mở lớp → **Điểm danh**.
2. Mặc định tất cả học sinh **Có mặt**.
3. Chạm từng em để đổi trạng thái (Vắng / Có phép / Đi muộn).
4. Nhấn **Lưu điểm danh** khi xong.

Có thể chọn ngày trước/sau bằng mũi tên hoặc **Hôm nay**.

### Ghi nhận phát biểu

1. Mở lớp → **Phát biểu**.
2. Chạm thẻ học sinh — mỗi lần chạm = +1 lượt phát biểu.
3. **Hoàn tác** để hủy lượt vừa ghi (nếu nhấn nhầm).

### Cho / trừ điểm

1. Mở **Học sinh** → chọn em hoặc mở chi tiết học sinh.
2. Nhấn **+1**, **+2**, **+5** hoặc **-1**, **-2**, **-5**.
3. Có thể thêm lý do tùy chọn trước khi chấm.
4. Trừ điểm lớn (-2, -5) sẽ hỏi xác nhận.

### Xem báo cáo

1. Mở lớp → **Xem báo cáo** (trên tổng quan lớp).
2. Lọc theo: Hôm nay / Tuần này / Tháng này / Khoảng ngày tuỳ chọn.
3. Xem thống kê và danh sách học sinh nổi bật (phát biểu, điểm, vắng).

---

## Cấu trúc dự án

```text
src/
  app/              # Trang Next.js App Router + Server Actions
  components/       # UI dùng chung
  lib/              # Supabase, validation, aggregation
  types/            # TypeScript types
supabase/
  migrations/       # Schema, RLS, RPC functions
docs/
  architecture.md   # Quyết định kỹ thuật
  DEPLOYMENT.md     # Hướng dẫn deploy production
```

---

## Bảo mật

- Mọi dữ liệu lớp/học sinh được bảo vệ bởi **Row Level Security (RLS)** trên Supabase.
- Giáo viên A **không thể** xem/sửa dữ liệu lớp của giáo viên B, kể cả khi đoán được ID trong URL.
- Route `/dashboard` và `/classes/*` yêu cầu đăng nhập (proxy + layout server-side).
- Lỗi kỹ thuật không hiển thị trực tiếp cho giáo viên.

---

## Deploy production

Xem [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) cho Supabase + Vercel.

---

## Tài liệu thêm

- [Hướng dẫn giáo viên (Word) — bắt đầu source & tự sửa lỗi, không cần biết Git/Supabase](docs/QLLH_Huong_dan_giao_vien.docx)
- [Knowledge chung (business + tech) — đọc trước khi tiếp tục phát triển](docs/KNOWLEDGE.md)
- [Kiến trúc](docs/architecture.md)
- [Deploy](docs/DEPLOYMENT.md)
- [Seed dev](supabase/seed.example.sql)
- [AGENTS.md](AGENTS.md) — hướng dẫn cho Codex / Cursor / Claude (tự load Knowledge + Architecture)

### Dùng với OpenAI Codex

Mở repo rồi chạy `codex` — Codex tự đọc `AGENTS.md`. Để dùng config repo (budget instruction lớn hơn):

```bash
export CODEX_HOME="$(pwd)/.codex"
codex
```

Chi tiết: [`.codex/README.md`](.codex/README.md).
