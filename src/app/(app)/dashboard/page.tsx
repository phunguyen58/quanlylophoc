import Link from "next/link";
import { GraduationCap, UsersRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CreateClassForm } from "./create-class-form";
import { getLocalDateString } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { mapDatabaseError } from "@/lib/supabase/errors";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle() : { data: null };
  const { data: classes, error } = await supabase
    .from("classes")
    .select("id, name, school_year, grade")
    .is("deleted_at", null)
    .order("school_year", { ascending: false })
    .order("name");

  const classIds = classes?.map((classItem) => classItem.id) ?? [];
  const today = getLocalDateString();
  const { data: activeStudents } =
    classIds.length > 0
      ? await supabase.from("students").select("class_id").is("deleted_at", null).in("class_id", classIds)
      : { data: [] as { class_id: string }[] };

  const studentCountByClass = (activeStudents ?? []).reduce<Record<string, number>>((counts, student) => {
    counts[student.class_id] = (counts[student.class_id] ?? 0) + 1;
    return counts;
  }, {});

  const { data: attendanceRows } =
    classIds.length > 0
      ? await supabase
          .from("attendance")
          .select("class_id, status")
          .in("class_id", classIds)
          .eq("date", today)
      : { data: [] as { class_id: string; status: "PRESENT" | "ABSENT" | "EXCUSED" | "LATE" }[] };

  const attendanceByClass = (attendanceRows ?? []).reduce<
    Record<string, { absent: number; excused: number; late: number; recorded: number }>
  >((counts, row) => {
    const summary = counts[row.class_id] ?? { absent: 0, excused: 0, late: 0, recorded: 0 };
    summary.recorded += 1;
    if (row.status === "ABSENT") summary.absent += 1;
    if (row.status === "EXCUSED") summary.excused += 1;
    if (row.status === "LATE") summary.late += 1;
    counts[row.class_id] = summary;
    return counts;
  }, {});

  const displayName = profile?.full_name || user?.user_metadata.full_name || "Giáo viên";
  const loadErrorMessage = error ? mapDatabaseError(error, "Chưa thể tải danh sách lớp. Vui lòng thử lại sau.") : null;
  return <><header className="mb-4"><p className="text-sm text-muted-foreground">Xin chào,</p><h1 className="text-2xl font-bold tracking-tight">{displayName} 👋</h1><p className="mt-1 text-sm text-muted-foreground">Hôm nay cô/thầy muốn làm gì cho lớp?</p></header><section aria-labelledby="my-classes"><h2 className="mb-3 text-lg font-bold" id="my-classes">Lớp của tôi</h2>{loadErrorMessage ? <Card><CardContent className="text-muted-foreground">{loadErrorMessage}</CardContent></Card> : classes?.length ? <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">{classes.map((classItem) => { const studentsCount = studentCountByClass[classItem.id] ?? 0; const attendance = attendanceByClass[classItem.id]; const absent = attendance?.absent ?? 0; const present = attendance ? Math.max(studentsCount - absent - attendance.excused - attendance.late, 0) : null; return <Link href={`/classes/${classItem.id}`} key={classItem.id}><Card className="h-full transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md" size="sm"><CardContent><div className="flex items-start justify-between"><div><p className="text-lg font-bold text-primary">{classItem.name}</p><p className="text-xs text-muted-foreground">Năm học {classItem.school_year}</p></div><GraduationCap className="size-5 text-sky-500" /></div><div className="mt-2 flex items-center gap-1.5 text-xs font-medium"><UsersRound className="size-3.5" />{studentsCount} học sinh</div>{attendance ? <p className="mt-1.5 text-xs font-medium">🟢 {present} có mặt · 🔴 {absent} vắng</p> : <p className="mt-1.5 text-xs text-muted-foreground">Chưa điểm danh hôm nay</p>}</CardContent></Card></Link>; })}</div> : <Card><CardContent className="flex flex-col items-center py-6 text-center"><div className="grid size-11 place-items-center rounded-full bg-sky-100 text-primary"><GraduationCap className="size-5" /></div><h3 className="mt-3 text-base font-bold">Chưa có lớp nào</h3><p className="mt-1 max-w-sm text-xs text-muted-foreground">Tạo lớp đầu tiên để bắt đầu thêm học sinh và điểm danh.</p></CardContent></Card>}</section><CreateClassForm /></>;
}
