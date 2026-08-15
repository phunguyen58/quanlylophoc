-- Strengthen school-year format: YYYY-(YYYY+1), e.g. 2026-2027.
-- Safe to re-run. Does not drop data.

alter table public.school_years
  drop constraint if exists school_years_name_check;

alter table public.school_years
  add constraint school_years_name_check check (
    name ~ '^[0-9]{4}-[0-9]{4}$'
    and substring(name from 6 for 4)::int = substring(name from 1 for 4)::int + 1
  );

alter table public.classes
  drop constraint if exists classes_school_year_check;

alter table public.classes
  add constraint classes_school_year_check check (
    school_year ~ '^[0-9]{4}-[0-9]{4}$'
    and substring(school_year from 6 for 4)::int = substring(school_year from 1 for 4)::int + 1
  );
