-- SQL Upgrade Patch: Thêm cột is_active vào bảng quiz_questions để hỗ trợ ẩn/hiện câu hỏi đối với học sinh.
-- Hướng dẫn: Chạy câu lệnh này trong Supabase SQL Editor.

alter table public.quiz_questions add column if not exists is_active boolean not null default true;
