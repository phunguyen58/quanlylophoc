create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  question text not null check (char_length(btrim(question)) > 0),
  options text[] not null check (cardinality(options) = 4),
  correct_answer integer not null check (correct_answer between 0 and 3),
  explanation text not null,
  order_index integer not null default 0,
  grade integer not null default 4 check (grade between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lesson_videos (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) > 0),
  description text not null,
  youtube_url text not null check (char_length(btrim(youtube_url)) > 0),
  grade integer not null check (grade between 1 and 5),
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quiz_submissions (
  id uuid primary key default gen_random_uuid(),
  student_name text not null check (char_length(btrim(student_name)) > 0),
  class_name text not null check (char_length(btrim(class_name)) > 0),
  score integer not null,
  total_questions integer not null,
  completed_at timestamptz not null default now()
);

-- Enable RLS
alter table public.quiz_questions enable row level security;
alter table public.lesson_videos enable row level security;
alter table public.quiz_submissions enable row level security;

-- Policies for quiz_questions
create policy "Allow public read quiz questions"
  on public.quiz_questions for select using (true);

create policy "Allow authenticated write quiz questions"
  on public.quiz_questions for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Policies for lesson_videos
create policy "Allow public read lesson videos"
  on public.lesson_videos for select using (true);

create policy "Allow authenticated write lesson videos"
  on public.lesson_videos for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Policies for quiz_submissions
create policy "Allow public insert quiz submissions"
  on public.quiz_submissions for insert
  with check (true);

create policy "Allow authenticated read quiz submissions"
  on public.quiz_submissions for select
  using (auth.role() = 'authenticated');


-- 1. Bổ sung cột grade vào bảng quiz_questions nếu chưa có
alter table public.quiz_questions 
add column if not exists grade integer not null default 4 check (grade between 1 and 5);

-- 2. Tạo bảng lesson_videos để quản lý học liệu số (video bài giảng)
create table if not exists public.lesson_videos (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) > 0),
  description text not null,
  youtube_url text not null check (char_length(btrim(youtube_url)) > 0),
  grade integer not null check (grade between 1 and 5),
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Bật RLS cho bảng lesson_videos
alter table public.lesson_videos enable row level security;

-- 4. Tạo các chính sách bảo mật cho lesson_videos
drop policy if exists "Allow public read lesson videos" on public.lesson_videos;
create policy "Allow public read lesson videos"
  on public.lesson_videos for select using (true);

drop policy if exists "Allow authenticated write lesson videos" on public.lesson_videos;
create policy "Allow authenticated write lesson videos"
  on public.lesson_videos for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 5. Chèn một số dữ liệu mẫu ban đầu cho lesson_videos (khối lớp 4)
insert into public.lesson_videos (title, description, youtube_url, grade, order_index)
values 
('Khám phá thế giới máy tính - Kiến thức tin học', 'Bài học giúp học sinh làm quen với các bộ phận của máy tính và cách hoạt động cơ bản.', 'https://www.youtube.com/embed/zH3vHkG4jhs', 4, 1),
('Sử dụng bàn phím và chuột đúng cách', 'Hướng dẫn chi tiết tư thế ngồi gõ phím, thao tác chuột chính xác và bảo vệ sức khoẻ.', 'https://www.youtube.com/embed/0G6L36_yEwI', 4, 2),
('An toàn khi sử dụng Internet cho học sinh tiểu học', 'Những quy tắc vàng giúp em lướt web an toàn, phòng tránh kẻ xấu và thông tin độc hại.', 'https://www.youtube.com/embed/O8Yl1w8u6v4', 4, 3)
on conflict do nothing;