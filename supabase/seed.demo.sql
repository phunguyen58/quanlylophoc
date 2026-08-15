-- Fictional demo data for evaluating the teacher UI after creating at least one Supabase Auth user.
-- Run after reset_and_setup.sql and the migrations. It uses the first profile as demo teacher.
do $$
declare
  v_teacher uuid;
  v_year text;
  v_class_name text;
  v_class_id uuid;
  v_student_id uuid;
  v_i int;
  v_week int;
  v_names text[] := array['An','Bảo','Chi','Dũng','Hà','Hân','Khang','Linh','Minh','My','Nam','Ngân','Nhi','Phúc','Quân','Thảo','Trang','Tuấn','Vy','Yến','Đạt','Huy','Khôi','Lan','Mai','Ngọc','Phương','Sơn','Tâm','Trúc','Anh','Bình'];
begin
  select id into v_teacher from public.profiles order by created_at limit 1;
  if v_teacher is null then
    raise exception 'Create one Auth user first so the profile trigger can create a teacher profile.';
  end if;

  foreach v_year in array array['2025-2026','2026-2027'] loop
    foreach v_class_name in array array['Lớp 1.1','Lớp 2.1'] loop
      insert into public.classes (teacher_id, name, school_year, grade)
      values (v_teacher, v_class_name, v_year, substring(v_class_name from 'Lớp ([0-9]+)')::smallint)
      on conflict do nothing
      returning id into v_class_id;
      if v_class_id is null then
        select id into v_class_id from public.classes where teacher_id = v_teacher and name = v_class_name and school_year = v_year and deleted_at is null;
      end if;

      for v_i in 1..case when v_class_name = 'Lớp 1.1' then 30 else 32 end loop
        insert into public.students (class_id, student_code, full_name, date_of_birth, gender, notes)
        values (v_class_id, replace(v_year, '-', '') || '-' || replace(v_class_name, 'Lớp ', '') || '-' || lpad(v_i::text, 2, '0'),
                'Học sinh ' || v_names[v_i] || ' ' || lpad(v_i::text, 2, '0'),
                date '2019-01-01' + ((v_i * 17) % 330), case when v_i % 2 = 0 then 'FEMALE'::public.student_gender else 'MALE'::public.student_gender end,
                'Dữ liệu demo hư cấu')
        on conflict do nothing
        returning id into v_student_id;
        if v_student_id is null then
          select id into v_student_id from public.students where class_id = v_class_id and student_code = replace(v_year, '-', '') || '-' || replace(v_class_name, 'Lớp ', '') || '-' || lpad(v_i::text, 2, '0') and deleted_at is null;
        end if;

        for v_week in 1..35 loop
          insert into public.attendance (class_id, student_id, date, status, note)
          values (v_class_id, v_student_id, date '2026-09-01' + ((v_week - 1) * 7),
                  case when (v_i + v_week) % 23 = 0 then 'ABSENT'::public.attendance_status when (v_i + v_week) % 17 = 0 then 'EXCUSED'::public.attendance_status when (v_i + v_week) % 13 = 0 then 'LATE'::public.attendance_status else 'PRESENT'::public.attendance_status end,
                  case when (v_i + v_week) % 17 = 0 then 'Gia đình xin phép' else '' end)
          on conflict do nothing;
          insert into public.weekly_evaluations (class_id, student_id, week_number, level, comment)
          values (v_class_id, v_student_id, v_week,
                  (array['Rất tốt','Tốt','Khá','Trung bình','Cần cố gắng'])[1 + ((v_i + v_week) % 5)],
                  'Nhận xét demo tuần ' || v_week || ': học sinh tham gia học tập ổn định.')
          on conflict do nothing;
        end loop;

        insert into public.semester_scores (class_id, student_id, theory_score, practice_score)
        values (v_class_id, v_student_id, 6 + ((v_i % 5) * 0.5), 6.5 + ((v_i % 4) * 0.5)) on conflict do nothing;
        insert into public.annual_scores (class_id, student_id, theory_score, practice_score)
        values (v_class_id, v_student_id, 6.5 + ((v_i % 5) * 0.5), 7 + ((v_i % 4) * 0.5)) on conflict do nothing;
      end loop;
    end loop;
  end loop;
end $$;
