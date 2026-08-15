-- Weekly learning evaluations and 0-10 study scores for elementary class tracking.
create table if not exists public.weekly_evaluations (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete restrict,
  student_id uuid not null,
  week_number smallint not null check (week_number between 1 and 35),
  level text not null default '' check (char_length(btrim(level)) <= 60),
  comment text not null default '' check (char_length(comment) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, week_number),
  foreign key (student_id, class_id) references public.students (id, class_id) on delete restrict
);

create table if not exists public.semester_scores (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete restrict,
  student_id uuid not null,
  theory_score numeric(4,2) check (theory_score is null or theory_score between 0 and 10),
  practice_score numeric(4,2) check (practice_score is null or practice_score between 0 and 10),
  total_score numeric(4,2) generated always as (
    case when theory_score is null or practice_score is null then null else round(((theory_score + practice_score) / 2.0), 2) end
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id),
  foreign key (student_id, class_id) references public.students (id, class_id) on delete restrict
);

create table if not exists public.annual_scores (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete restrict,
  student_id uuid not null,
  theory_score numeric(4,2) check (theory_score is null or theory_score between 0 and 10),
  practice_score numeric(4,2) check (practice_score is null or practice_score between 0 and 10),
  total_score numeric(4,2) generated always as (
    case when theory_score is null or practice_score is null then null else round(((theory_score + practice_score) / 2.0), 2) end
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id),
  foreign key (student_id, class_id) references public.students (id, class_id) on delete restrict
);

create index if not exists weekly_evaluations_class_week_idx on public.weekly_evaluations (class_id, week_number);
create index if not exists semester_scores_class_idx on public.semester_scores (class_id);
create index if not exists annual_scores_class_idx on public.annual_scores (class_id);

drop trigger if exists weekly_evaluations_set_updated_at on public.weekly_evaluations;
create trigger weekly_evaluations_set_updated_at before update on public.weekly_evaluations for each row execute function public.set_updated_at();
drop trigger if exists semester_scores_set_updated_at on public.semester_scores;
create trigger semester_scores_set_updated_at before update on public.semester_scores for each row execute function public.set_updated_at();
drop trigger if exists annual_scores_set_updated_at on public.annual_scores;
create trigger annual_scores_set_updated_at before update on public.annual_scores for each row execute function public.set_updated_at();

alter table public.weekly_evaluations enable row level security;
alter table public.semester_scores enable row level security;
alter table public.annual_scores enable row level security;

drop policy if exists "Teachers manage weekly evaluations in their classes" on public.weekly_evaluations;
create policy "Teachers manage weekly evaluations in their classes" on public.weekly_evaluations for all
  using (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid() and c.deleted_at is null))
  with check (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid() and c.deleted_at is null));

drop policy if exists "Teachers manage semester scores in their classes" on public.semester_scores;
create policy "Teachers manage semester scores in their classes" on public.semester_scores for all
  using (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid() and c.deleted_at is null))
  with check (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid() and c.deleted_at is null));

drop policy if exists "Teachers manage annual scores in their classes" on public.annual_scores;
create policy "Teachers manage annual scores in their classes" on public.annual_scores for all
  using (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid() and c.deleted_at is null))
  with check (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid() and c.deleted_at is null));
