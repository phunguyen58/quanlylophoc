"use client";

import { useMemo, useState } from "react";
import { WeekBoard } from "@/app/(app)/classes/[classId]/weeks/[week]/week-board";
import { Card, CardContent } from "@/components/ui/card";
import { toWeeklyAttendanceStatus } from "@/lib/attendance/format";
import { DEFAULT_EVALUATION_LEVELS } from "@/lib/evaluations/levels";
import { TOTAL_WEEKS, weekLabel, weekNumbers } from "@/lib/weeks";
import { cn } from "@/lib/utils";
import type { AttendanceStatus } from "@/types/attendance";

type Student = { id: string; full_name: string; student_code: string };
type AttendanceRow = {
  student_id: string;
  week_number: number;
  status: AttendanceStatus;
  note: string;
};
type EvaluationRow = {
  student_id: string;
  week_number: number;
  level: string;
  comment: string;
};
type WeekMeta = {
  week_number: number;
  start_date: string | null;
  end_date: string | null;
};

export function ClassWeeksPanel({
  classId,
  className,
  schoolYear,
  students,
  attendance,
  evaluations,
  weekMetas,
  initialWeek,
}: {
  classId: string;
  className: string;
  schoolYear: string;
  students: Student[];
  attendance: AttendanceRow[];
  evaluations: EvaluationRow[];
  weekMetas: WeekMeta[];
  initialWeek: number;
}) {
  const [selectedWeek, setSelectedWeek] = useState<number>(initialWeek);

  const savedWeeks = useMemo(() => {
    const set = new Set<number>();
    for (const row of attendance) set.add(row.week_number);
    for (const row of evaluations) {
      if (row.level || row.comment) set.add(row.week_number);
    }
    for (const meta of weekMetas) {
      if (meta.start_date || meta.end_date) set.add(meta.week_number);
    }
    return set;
  }, [attendance, evaluations, weekMetas]);

  const weekAttendance = useMemo(
    () =>
      attendance
        .filter((row) => row.week_number === selectedWeek)
        .map((row) => ({
          student_id: row.student_id,
          status: row.status,
          note: row.note,
        })),
    [attendance, selectedWeek],
  );

  const weekEvaluations = useMemo(
    () =>
      evaluations
        .filter((row) => row.week_number === selectedWeek)
        .map((row) => ({
          student_id: row.student_id,
          level: row.level,
          comment: row.comment,
        })),
    [evaluations, selectedWeek],
  );

  const attendanceSummary = useMemo(() => {
    let present = 0;
    let absent = 0;
    for (const row of weekAttendance) {
      if (toWeeklyAttendanceStatus(row.status) === "PRESENT") present += 1;
      else absent += 1;
    }
    return { present, absent };
  }, [weekAttendance]);

  const evaluationSummary = useMemo(() => {
    const counts = new Map<string, number>();
    for (const level of DEFAULT_EVALUATION_LEVELS) counts.set(level, 0);
    for (const row of weekEvaluations) {
      const level = (row.level || "").trim();
      if (!level) continue;
      counts.set(level, (counts.get(level) ?? 0) + 1);
    }
    return [...counts.entries()].filter(([, count]) => count > 0);
  }, [weekEvaluations]);

  const meta = weekMetas.find((item) => item.week_number === selectedWeek);

  return (
    <section aria-labelledby="week-grid" className="space-y-4">
      <div>
        <h2 className="mb-1 text-base font-bold" id="week-grid">
          Tuần 1 → {TOTAL_WEEKS}
        </h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Chọn tuần bên dưới. Dấu · nhỏ = tuần đã có dữ liệu.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {weekNumbers().map((week) => {
            const isSelected = selectedWeek === week;
            const hasData = savedWeeks.has(week);
            return (
              <button
                aria-pressed={isSelected}
                className={cn(
                  "relative grid h-9 w-10 shrink-0 place-items-center rounded-lg border text-xs font-semibold",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-card hover:bg-muted",
                )}
                key={week}
                onClick={() => setSelectedWeek(week)}
                type="button"
              >
                {week}
                {hasData && !isSelected ? (
                  <span className="absolute bottom-0.5 size-1 rounded-full bg-emerald-500" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <section className="grid gap-2 sm:grid-cols-2">
        <Card size="sm">
          <CardContent>
            <p className="text-xs font-semibold text-muted-foreground">
              Điểm danh {weekLabel(selectedWeek)}
            </p>
            {weekAttendance.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Chưa lưu điểm danh tuần này.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                <li>Có mặt: {attendanceSummary.present}</li>
                <li>Vắng: {attendanceSummary.absent}</li>
              </ul>
            )}
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <p className="text-xs font-semibold text-muted-foreground">
              Đánh giá {weekLabel(selectedWeek)}
            </p>
            {evaluationSummary.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Chưa có đánh giá tuần này.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {evaluationSummary.map(([level, count]) => (
                  <li key={level}>
                    {level}: {count}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <div className="rounded-xl border bg-background p-3 sm:p-4">
        <WeekBoard
          attendance={weekAttendance}
          classId={classId}
          className={className}
          endDate={meta?.end_date ?? ""}
          evaluations={weekEvaluations}
          key={selectedWeek}
          onWeekChange={setSelectedWeek}
          schoolYear={schoolYear}
          startDate={meta?.start_date ?? ""}
          students={students}
          week={selectedWeek}
        />
      </div>
    </section>
  );
}
