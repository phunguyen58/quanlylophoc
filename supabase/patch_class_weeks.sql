-- Additive patch: week date range per class (safe on existing projects).
create table if not exists public.class_weeks (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete restrict,
  week_number smallint not null check (week_number between 1 and 35),
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_id, week_number),
  check (start_date is null or end_date is null or start_date <= end_date)
);
create index if not exists class_weeks_class_idx on public.class_weeks (class_id);
drop trigger if exists class_weeks_set_updated_at on public.class_weeks;
create trigger class_weeks_set_updated_at before update on public.class_weeks
  for each row execute function public.set_updated_at();
alter table public.class_weeks enable row level security;
drop policy if exists "Teachers manage class weeks in their classes" on public.class_weeks;
create policy "Teachers manage class weeks in their classes" on public.class_weeks for all
  using (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid() and c.deleted_at is null))
  with check (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid() and c.deleted_at is null));
