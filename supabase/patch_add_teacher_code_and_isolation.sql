-- SQL Upgrade Patch: Phân tách dữ liệu Giáo viên bằng teacher_code & teacher_id
-- Hướng dẫn: Chạy câu lệnh này trong Supabase SQL Editor.

-- 1. Bổ sung cột teacher_code vào bảng profiles
alter table public.profiles add column if not exists teacher_code text unique;

-- Cập nhật mã mặc định cho các giáo viên hiện tại (lấy 6 ký tự đầu của UUID viết hoa)
update public.profiles 
set teacher_code = upper(substring(id::text from 1 for 6)) 
where teacher_code is null;

-- Đặt cột teacher_code thành NOT NULL
alter table public.profiles alter column teacher_code set not null;

-- 2. Thêm cột teacher_id vào các bảng trắc nghiệm & học liệu và lập chỉ mục tối ưu hiệu năng
alter table public.quiz_questions add column if not exists teacher_id uuid references public.profiles(id) on delete cascade;
alter table public.lesson_videos add column if not exists teacher_id uuid references public.profiles(id) on delete cascade;
alter table public.quiz_submissions add column if not exists teacher_id uuid references public.profiles(id) on delete cascade;

create index if not exists quiz_questions_teacher_id_idx on public.quiz_questions(teacher_id);
create index if not exists lesson_videos_teacher_id_idx on public.lesson_videos(teacher_id);
create index if not exists quiz_submissions_teacher_id_idx on public.quiz_submissions(teacher_id);

-- Gán mặc định teacher_id cho dữ liệu cũ (nếu có) bằng ID giáo viên đầu tiên
do $$
declare
  first_teacher_id uuid;
begin
  select id into first_teacher_id from public.profiles limit 1;
  if first_teacher_id is not null then
    update public.quiz_questions set teacher_id = first_teacher_id where teacher_id is null;
    update public.lesson_videos set teacher_id = first_teacher_id where teacher_id is null;
    update public.quiz_submissions set teacher_id = first_teacher_id where teacher_id is null;
  end if;
end $$;

-- 3. Cập nhật RLS Policies cho quiz_questions
drop policy if exists "Allow public read quiz questions" on public.quiz_questions;
create policy "Allow public read quiz questions"
  on public.quiz_questions for select using (true);

drop policy if exists "Allow authenticated write quiz questions" on public.quiz_questions;
create policy "Allow authenticated write quiz questions"
  on public.quiz_questions for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

-- 4. Cập nhật RLS Policies cho lesson_videos
drop policy if exists "Allow public read lesson videos" on public.lesson_videos;
create policy "Allow public read lesson videos"
  on public.lesson_videos for select using (true);

drop policy if exists "Allow authenticated write lesson videos" on public.lesson_videos;
create policy "Allow authenticated write lesson videos"
  on public.lesson_videos for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

-- 5. Cập nhật RLS Policies cho quiz_submissions
drop policy if exists "Allow public insert quiz submissions" on public.quiz_submissions;
create policy "Allow public insert quiz submissions"
  on public.quiz_submissions for insert
  with check (true);

drop policy if exists "Allow authenticated read quiz submissions" on public.quiz_submissions;
create policy "Allow authenticated read quiz submissions"
  on public.quiz_submissions for select
  using (auth.uid() = teacher_id);

drop policy if exists "Allow authenticated delete quiz submissions" on public.quiz_submissions;
create policy "Allow authenticated delete quiz submissions"
  on public.quiz_submissions for delete
  using (auth.uid() = teacher_id);

-- 6. Cho phép public đọc profiles để học sinh xác thực mã code giáo viên
drop policy if exists "Teachers can view their profile" on public.profiles;
create policy "Allow public read profiles" on public.profiles for select using (true);
