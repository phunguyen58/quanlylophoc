import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { aggregateParticipationCounts } from "@/lib/participation/summary";
import { summarizeDay } from "@/lib/attendance/summary";
import {
  getLocalDateString,
  getLocalDayBoundsIso,
  getMonthRangeLocal,
  isFutureDateString,
  isIsoDateString,
} from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type { AttendanceRecord, AttendanceStatus } from "@/types/attendance";
import { SessionTabs, type SessionTab } from "./session-tabs";

function parseTab(value: string | undefined): SessionTab {
  return value === "participation" ? "participation" : "attendance";
}

export default async function ClassSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ date?: string; tab?: string }>;
}) {
  const { classId } = await params;
  const { date: dateParam, tab: tabParam } = await searchParams;
  const today = getLocalDateString();
  const initialTab = parseTab(tabParam);

  let date = today;
  if (dateParam) {
    if (!isIsoDateString(dateParam)) {
      redirect(`/classes/${classId}/session?tab=${initialTab}`);
    }
    if (isFutureDateString(dateParam, today)) {
      redirect(`/classes/${classId}/session?tab=${initialTab}&date=${today}`);
    }
    date = dateParam;
  }

  const supabase = await createClient();

  const { data: classItem } = await supabase
    .from("classes")
    .select("id, name, school_year, grade")
    .eq("id", classId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!classItem) notFound();

  const { data: students } = await supabase
    .from("students")
    .select("id, full_name, student_code")
    .eq("class_id", classId)
    .is("deleted_at", null)
    .order("full_name")
    .order("id");

  const activeStudentCount = students?.length ?? 0;

  const { data: attendanceRows } = await supabase
    .from("attendance")
    .select("student_id, status, note")
    .eq("class_id", classId)
    .eq("date", date);

  const savedRecords: AttendanceRecord[] = (attendanceRows ?? []).map((row) => ({
    student_id: row.student_id,
    status: row.status as AttendanceStatus,
    note: row.note,
  }));

  const { start: historyStart, end: historyEnd } = getMonthRangeLocal(today);

  const { data: historyRows } = await supabase
    .from("attendance")
    .select("date, status")
    .eq("class_id", classId)
    .gte("date", historyStart)
    .lte("date", historyEnd)
    .order("date", { ascending: false });

  const historyByDate = new Map<string, { status: AttendanceStatus }[]>();
  for (const row of historyRows ?? []) {
    const dateKey = String(row.date);
    const list = historyByDate.get(dateKey) ?? [];
    list.push({ status: row.status as AttendanceStatus });
    historyByDate.set(dateKey, list);
  }

  const historySummaries = [...historyByDate.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([historyDate, records]) =>
      summarizeDay(historyDate, records, activeStudentCount),
    );

  const { start, end } = getLocalDayBoundsIso(date);

  const { data: participationEvents } = await supabase
    .from("participation_events")
    .select("student_id, points")
    .eq("class_id", classId)
    .eq("event_type", "PARTICIPATION")
    .gte("created_at", start)
    .lte("created_at", end);

  const initialCounts = aggregateParticipationCounts(participationEvents ?? []);

  const attendanceBoardKey = `${date}:${savedRecords
    .map((record) => `${record.student_id}:${record.status}:${record.note}`)
    .join("|")}:${students?.map((student) => student.id).join("|") ?? ""}`;

  const participationBoardKey = `${date}:${Object.entries(initialCounts)
    .map(([studentId, count]) => `${studentId}:${count}`)
    .join("|")}:${students?.map((student) => student.id).join("|") ?? ""}`;

  return (
    <>
      <Link
        className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
        href={`/classes/${classId}`}
      >
        <ArrowLeft className="size-4" />
        Quay lại lớp {classItem.name}
      </Link>

      <header className="mb-4">
        <p className="text-xs text-muted-foreground">
          Khối {classItem.grade} · Năm học {classItem.school_year}
        </p>
        <h1 className="mt-0.5 text-2xl font-bold">Quản lý buổi học — {classItem.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{activeStudentCount} học sinh</p>
      </header>

      <Suspense fallback={<p className="text-sm text-muted-foreground">Đang tải…</p>}>
        <SessionTabs
          attendanceBoardKey={attendanceBoardKey}
          classId={classId}
          className={classItem.name}
          date={date}
          historySummaries={historySummaries}
          initialCounts={initialCounts}
          initialTab={initialTab}
          participationBoardKey={participationBoardKey}
          savedRecords={savedRecords}
          students={students ?? []}
          today={today}
        />
      </Suspense>
    </>
  );
}
