import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { WeeklyEvaluationBoard } from "./weekly-evaluation-board";

export default async function WeeklyPage({ params, searchParams }: { params: Promise<{ classId: string }>; searchParams: Promise<{ week?: string }> }) {
  const { classId } = await params; const sp = await searchParams; const week = Math.min(Math.max(Number(sp.week ?? 1) || 1, 1), 35);
  const supabase = await createClient();
  const { data: classItem } = await supabase.from("classes").select("id, name, school_year").eq("id", classId).is("deleted_at", null).maybeSingle();
  if (!classItem) notFound();
  const { data: students } = await supabase.from("students").select("id, full_name, student_code").eq("class_id", classId).is("deleted_at", null).order("full_name");
  const { data: saved } = await supabase.from("weekly_evaluations").select("student_id, level, comment").eq("class_id", classId).eq("week_number", week);
  return <><Link className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary" href={`/classes/${classId}`}><ArrowLeft className="size-4" />Quay lại lớp</Link><header className="mb-4"><p className="text-xs text-muted-foreground">{classItem.school_year}</p><h1 className="text-2xl font-bold">Đánh giá học tập · {classItem.name}</h1></header><WeeklyEvaluationBoard classId={classId} initialWeek={week} saved={saved ?? []} students={students ?? []} /></>;
}
