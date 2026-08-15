-- QLLH destructive reset + complete setup.
-- WARNING: permanently deletes all QLLH classes, students, attendance and event history.
-- Does NOT delete Supabase Auth accounts.

-- DESTRUCTIVE: resets QLLH application data and schema only.
-- auth.users accounts are preserved; profiles are recreated by the setup script.
begin;

drop trigger if exists on_auth_user_created on auth.users;

drop table if exists public.student_points cascade;
drop table if exists public.participation_events cascade;
drop table if exists public.attendance cascade;
drop table if exists public.students cascade;
drop table if exists public.classes cascade;
drop table if exists public.profiles cascade;

-- Table drops remove the dependent updated_at triggers. Functions are dropped afterwards.
drop function if exists public.undo_student_points_event(uuid, uuid);
drop function if exists public.undo_participation_event(uuid, uuid);
drop function if exists public.import_students(uuid, jsonb);
drop function if exists public.save_attendance(uuid, date, jsonb);
drop function if exists public.record_student_points(uuid, uuid, integer, text, uuid);
drop function if exists public.record_participation(uuid, uuid, uuid, integer);
drop function if exists public.handle_new_user();
drop function if exists public.set_updated_at();

drop type if exists public.participation_event_type;
drop type if exists public.student_gender;
drop type if exists public.attendance_status;

commit;
-- QLLH destructive reset + complete setup.
-- WARNING: permanently deletes all QLLH classes, students, attendance and event history.
-- Does NOT delete Supabase Auth accounts.

-- QLLH complete database setup. Run this entire file once in Supabase SQL Editor on a new/empty project.

-- QLLH MVP schema. Apply through Supabase migrations or SQL Editor.
create extension if not exists pgcrypto;

create type public.attendance_status as enum ('PRESENT', 'ABSENT', 'EXCUSED', 'LATE');
create type public.student_gender as enum ('MALE', 'FEMALE', 'OTHER', 'UNSPECIFIED');
create type public.participation_event_type as enum ('PARTICIPATION');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete restrict,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  school_year text not null check (school_year ~ '^[0-9]{4}-[0-9]{4}$'),
  grade smallint not null check (grade between 1 and 12),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index classes_active_teacher_name_year_key
  on public.classes (teacher_id, lower(name), school_year) where deleted_at is null;
create index classes_active_teacher_idx on public.classes (teacher_id, created_at desc) where deleted_at is null;

create table public.students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete restrict,
  student_code text not null check (char_length(btrim(student_code)) between 1 and 50),
  full_name text not null check (char_length(btrim(full_name)) between 1 and 120),
  date_of_birth date,
  gender public.student_gender not null default 'UNSPECIFIED',
  notes text not null default '' check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (id, class_id)
);

create unique index students_active_class_code_key
  on public.students (class_id, lower(student_code)) where deleted_at is null;
create index students_active_class_name_idx
  on public.students (class_id, full_name, id) where deleted_at is null;

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete restrict,
  student_id uuid not null,
  date date not null,
  status public.attendance_status not null,
  note text not null default '' check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, date),
  foreign key (student_id, class_id) references public.students (id, class_id) on delete restrict
);
create index attendance_class_date_idx on public.attendance (class_id, date desc);
create index attendance_student_date_idx on public.attendance (student_id, date desc);

create table public.participation_events (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete restrict,
  student_id uuid not null,
  event_type public.participation_event_type not null default 'PARTICIPATION',
  points integer not null check (points in (-1, 1)),
  note text not null default '' check (char_length(note) <= 500),
  client_request_id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  foreign key (student_id, class_id) references public.students (id, class_id) on delete restrict,
  unique (created_by, client_request_id)
);
create index participation_events_class_created_idx on public.participation_events (class_id, created_at desc);
create index participation_events_student_created_idx on public.participation_events (student_id, created_at desc);

create table public.student_points (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete restrict,
  student_id uuid not null,
  points integer not null check (points <> 0 and points between -100 and 100),
  reason text not null check (char_length(btrim(reason)) between 1 and 500),
  client_request_id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  foreign key (student_id, class_id) references public.students (id, class_id) on delete restrict,
  unique (created_by, client_request_id)
);
create index student_points_class_created_idx on public.student_points (class_id, created_at desc);
create index student_points_student_created_idx on public.student_points (student_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger classes_set_updated_at before update on public.classes for each row execute function public.set_updated_at();
create trigger students_set_updated_at before update on public.students for each row execute function public.set_updated_at();
create trigger attendance_set_updated_at before update on public.attendance for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1), 'Giáo viên'));
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();
-- QLLH complete database setup. Run this entire file once in Supabase SQL Editor on a new/empty project.

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.attendance enable row level security;
alter table public.participation_events enable row level security;
alter table public.student_points enable row level security;

create policy "Teachers can view their profile" on public.profiles for select using (id = auth.uid());
create policy "Teachers can update their profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "Teachers view their classes" on public.classes for select using (teacher_id = auth.uid());
create policy "Teachers create their classes" on public.classes for insert with check (teacher_id = auth.uid());
create policy "Teachers update their classes" on public.classes for update using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
create policy "Teachers view students in their classes" on public.students for select
  using (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid() and c.deleted_at is null));
create policy "Teachers create students in their classes" on public.students for insert
  with check (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid() and c.deleted_at is null));
create policy "Teachers update students in their classes" on public.students for update
  using (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid() and c.deleted_at is null))
  with check (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid() and c.deleted_at is null));
create policy "Teachers manage attendance in their classes" on public.attendance for all
  using (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid() and c.deleted_at is null))
  with check (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid() and c.deleted_at is null));
create policy "Teachers manage participation in their classes" on public.participation_events for all
  using (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid() and c.deleted_at is null))
  with check (created_by = auth.uid() and exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid() and c.deleted_at is null));
create policy "Teachers manage points in their classes" on public.student_points for all
  using (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid() and c.deleted_at is null))
  with check (created_by = auth.uid() and exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid() and c.deleted_at is null));

create or replace function public.record_participation(p_class_id uuid, p_student_id uuid, p_request_id uuid, p_points integer default 1)
returns public.participation_events
language plpgsql security invoker set search_path = public as $$
declare v_event public.participation_events;
begin
  if auth.uid() is null or p_points not in (-1, 1) then raise exception 'Invalid participation request' using errcode = '22023'; end if;
  if not exists (select 1 from public.students s join public.classes c on c.id = s.class_id where s.id = p_student_id and s.class_id = p_class_id and s.deleted_at is null and c.teacher_id = auth.uid() and c.deleted_at is null) then
    raise exception 'Student is unavailable' using errcode = '42501';
  end if;
  insert into public.participation_events (class_id, student_id, points, client_request_id, created_by)
  values (p_class_id, p_student_id, p_points, p_request_id, auth.uid())
  on conflict (created_by, client_request_id) do update set client_request_id = excluded.client_request_id
  returning * into v_event;
  return v_event;
end;
$$;

create or replace function public.record_student_points(p_class_id uuid, p_student_id uuid, p_points integer, p_reason text, p_request_id uuid)
returns public.student_points
language plpgsql security invoker set search_path = public as $$
declare v_point public.student_points;
begin
  if auth.uid() is null or p_points = 0 or p_points not between -100 and 100 or char_length(btrim(p_reason)) not between 1 and 500 then raise exception 'Invalid points request' using errcode = '22023'; end if;
  if not exists (select 1 from public.students s join public.classes c on c.id = s.class_id where s.id = p_student_id and s.class_id = p_class_id and s.deleted_at is null and c.teacher_id = auth.uid() and c.deleted_at is null) then raise exception 'Student is unavailable' using errcode = '42501'; end if;
  insert into public.student_points (class_id, student_id, points, reason, client_request_id, created_by)
  values (p_class_id, p_student_id, p_points, btrim(p_reason), p_request_id, auth.uid())
  on conflict (created_by, client_request_id) do update set client_request_id = excluded.client_request_id
  returning * into v_point;
  return v_point;
end;
$$;

create or replace function public.save_attendance(p_class_id uuid, p_date date, p_entries jsonb)
returns integer
language plpgsql security invoker set search_path = public as $$
declare v_count integer;
begin
  if auth.uid() is null or p_date is null or jsonb_typeof(p_entries) <> 'array' then raise exception 'Invalid attendance request' using errcode = '22023'; end if;
  if not exists (select 1 from public.classes c where c.id = p_class_id and c.teacher_id = auth.uid() and c.deleted_at is null) then raise exception 'Class is unavailable' using errcode = '42501'; end if;
  if exists (select 1 from jsonb_to_recordset(p_entries) as e(student_id uuid, status public.attendance_status, note text) left join public.students s on s.id = e.student_id and s.class_id = p_class_id and s.deleted_at is null where s.id is null or e.student_id is null or e.status is null or char_length(coalesce(e.note, '')) > 500) then
    raise exception 'Invalid attendance entries' using errcode = '22023';
  end if;
  if (select count(*) from jsonb_to_recordset(p_entries) as e(student_id uuid, status public.attendance_status, note text)) <> (select count(distinct e.student_id) from jsonb_to_recordset(p_entries) as e(student_id uuid, status public.attendance_status, note text)) then
    raise exception 'Duplicate student in attendance request' using errcode = '22023';
  end if;
  insert into public.attendance (class_id, student_id, date, status, note)
  select p_class_id, e.student_id, p_date, e.status, coalesce(e.note, '') from jsonb_to_recordset(p_entries) as e(student_id uuid, status public.attendance_status, note text)
  on conflict (student_id, date) do update set status = excluded.status, note = excluded.note, updated_at = now()
  where public.attendance.class_id = p_class_id;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.record_participation(uuid, uuid, uuid, integer) from public;
revoke all on function public.record_student_points(uuid, uuid, integer, text, uuid) from public;
revoke all on function public.save_attendance(uuid, date, jsonb) from public;
grant execute on function public.record_participation(uuid, uuid, uuid, integer) to authenticated;
grant execute on function public.record_student_points(uuid, uuid, integer, text, uuid) to authenticated;
grant execute on function public.save_attendance(uuid, date, jsonb) to authenticated;
-- QLLH complete database setup. Run this entire file once in Supabase SQL Editor on a new/empty project.

create or replace function public.import_students(p_class_id uuid, p_students jsonb)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_count integer;
begin
  if auth.uid() is null or jsonb_typeof(p_students) <> 'array' then
    raise exception 'Invalid import request' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.classes c
    where c.id = p_class_id
      and c.teacher_id = auth.uid()
      and c.deleted_at is null
  ) then
    raise exception 'Class is unavailable' using errcode = '42501';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_students) as s(
      student_code text,
      full_name text,
      date_of_birth date,
      gender public.student_gender,
      notes text
    )
    where s.student_code is null
      or char_length(btrim(s.student_code)) not between 1 and 50
      or s.full_name is null
      or char_length(btrim(s.full_name)) not between 1 and 120
      or char_length(coalesce(s.notes, '')) > 2000
  ) then
    raise exception 'Invalid student rows' using errcode = '22023';
  end if;

  if (
    select count(*)
    from jsonb_to_recordset(p_students) as s(
      student_code text,
      full_name text,
      date_of_birth date,
      gender public.student_gender,
      notes text
    )
  ) <> (
    select count(distinct lower(btrim(s.student_code)))
    from jsonb_to_recordset(p_students) as s(
      student_code text,
      full_name text,
      date_of_birth date,
      gender public.student_gender,
      notes text
    )
  ) then
    raise exception 'Duplicate student code in import request' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_students) as s(
      student_code text,
      full_name text,
      date_of_birth date,
      gender public.student_gender,
      notes text
    )
    join public.students st
      on st.class_id = p_class_id
     and lower(st.student_code) = lower(btrim(s.student_code))
     and st.deleted_at is null
  ) then
    raise exception 'Duplicate student code in class' using errcode = '23505';
  end if;

  insert into public.students (
    class_id,
    student_code,
    full_name,
    date_of_birth,
    gender,
    notes
  )
  select
    p_class_id,
    btrim(s.student_code),
    btrim(s.full_name),
    s.date_of_birth,
    coalesce(s.gender, 'UNSPECIFIED'::public.student_gender),
    coalesce(s.notes, '')
  from jsonb_to_recordset(p_students) as s(
    student_code text,
    full_name text,
    date_of_birth date,
    gender public.student_gender,
    notes text
  );

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.import_students(uuid, jsonb) from public;
grant execute on function public.import_students(uuid, jsonb) to authenticated;
-- QLLH complete database setup. Run this entire file once in Supabase SQL Editor on a new/empty project.

create or replace function public.undo_participation_event(p_class_id uuid, p_event_id uuid)
returns public.participation_events
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_event public.participation_events;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.participation_events pe
    join public.classes c on c.id = pe.class_id
    where pe.id = p_event_id
      and pe.class_id = p_class_id
      and pe.created_by = auth.uid()
      and pe.points = 1
      and pe.event_type = 'PARTICIPATION'
      and c.teacher_id = auth.uid()
      and c.deleted_at is null
  ) then
    raise exception 'Event cannot be undone' using errcode = '42501';
  end if;

  delete from public.participation_events
  where id = p_event_id
    and class_id = p_class_id
    and created_by = auth.uid()
  returning * into v_event;

  return v_event;
end;
$$;

revoke all on function public.undo_participation_event(uuid, uuid) from public;
grant execute on function public.undo_participation_event(uuid, uuid) to authenticated;
-- QLLH complete database setup. Run this entire file once in Supabase SQL Editor on a new/empty project.

create or replace function public.undo_student_points_event(p_class_id uuid, p_event_id uuid)
returns public.student_points
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_event public.student_points;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.student_points sp
    join public.classes c on c.id = sp.class_id
    where sp.id = p_event_id
      and sp.class_id = p_class_id
      and sp.created_by = auth.uid()
      and c.teacher_id = auth.uid()
      and c.deleted_at is null
  ) then
    raise exception 'Event cannot be undone' using errcode = '42501';
  end if;

  delete from public.student_points
  where id = p_event_id
    and class_id = p_class_id
    and created_by = auth.uid()
  returning * into v_event;

  return v_event;
end;
$$;

revoke all on function public.undo_student_points_event(uuid, uuid) from public;
grant execute on function public.undo_student_points_event(uuid, uuid) to authenticated;
-- QLLH complete database setup. Run this entire file once in Supabase SQL Editor on a new/empty project.

-- Allow teachers to create their own profile (e.g. account existed before migrations).
create policy "Teachers can insert their profile"
  on public.profiles for insert
  with check (id = auth.uid());

-- Backfill profiles for accounts created before handle_new_user trigger existed.
insert into public.profiles (id, full_name)
select
  id,
  coalesce(
    nullif(btrim(raw_user_meta_data ->> 'full_name'), ''),
    split_part(email, '@', 1),
    'Giáo viên'
  )
from auth.users
on conflict (id) do nothing;
-- QLLH complete database setup. Run this entire file once in Supabase SQL Editor on a new/empty project.

-- Undo creates a compensating event instead of deleting history. It is limited to
-- the latest event for that teacher/student and a short 30-second window.
create or replace function public.undo_participation_event(p_class_id uuid, p_event_id uuid)
returns public.participation_events
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_original public.participation_events;
  v_undo public.participation_events;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized' using errcode = '42501';
  end if;

  select pe.* into v_original
  from public.participation_events pe
  join public.classes c on c.id = pe.class_id
  where pe.id = p_event_id
    and pe.class_id = p_class_id
    and pe.created_by = auth.uid()
    and pe.points = 1
    and pe.event_type = 'PARTICIPATION'
    and pe.created_at >= now() - interval '30 seconds'
    and c.teacher_id = auth.uid()
    and c.deleted_at is null
    and not exists (
      select 1 from public.participation_events newer
      where newer.class_id = pe.class_id
        and newer.student_id = pe.student_id
        and newer.created_by = pe.created_by
        and newer.event_type = 'PARTICIPATION'
        and newer.created_at > pe.created_at
    );

  if not found then
    raise exception 'Event cannot be undone' using errcode = '42501';
  end if;

  insert into public.participation_events (
    class_id, student_id, event_type, points, note, created_by
  ) values (
    v_original.class_id, v_original.student_id, 'PARTICIPATION', -1,
    'Hoàn tác lượt phát biểu', auth.uid()
  ) returning * into v_undo;

  return v_undo;
end;
$$;

create or replace function public.undo_student_points_event(p_class_id uuid, p_event_id uuid)
returns public.student_points
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_original public.student_points;
  v_undo public.student_points;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized' using errcode = '42501';
  end if;

  select sp.* into v_original
  from public.student_points sp
  join public.classes c on c.id = sp.class_id
  where sp.id = p_event_id
    and sp.class_id = p_class_id
    and sp.created_by = auth.uid()
    and sp.created_at >= now() - interval '30 seconds'
    and c.teacher_id = auth.uid()
    and c.deleted_at is null
    and not exists (
      select 1 from public.student_points newer
      where newer.class_id = sp.class_id
        and newer.student_id = sp.student_id
        and newer.created_by = sp.created_by
        and newer.created_at > sp.created_at
    );

  if not found then
    raise exception 'Event cannot be undone' using errcode = '42501';
  end if;

  insert into public.student_points (
    class_id, student_id, points, reason, created_by
  ) values (
    v_original.class_id, v_original.student_id, -v_original.points,
    'Hoàn tác: ' || v_original.reason, auth.uid()
  ) returning * into v_undo;

  return v_undo;
end;
$$;
-- QLLH complete database setup. Run this entire file once in Supabase SQL Editor on a new/empty project.

-- The original regex escaped \d twice, rejecting valid values such as 2026-2027.
alter table public.classes drop constraint if exists classes_school_year_check;
alter table public.classes
  add constraint classes_school_year_check
  check (school_year ~ '^[0-9]{4}-[0-9]{4}$');
