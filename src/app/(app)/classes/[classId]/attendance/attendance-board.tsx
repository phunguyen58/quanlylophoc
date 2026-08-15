"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saveAttendance } from "@/app/actions/attendance";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ATTENDANCE_STATUS_OPTIONS,
  attendanceNeedsNote,
} from "@/lib/attendance/format";
import {
  getMonthRangeLocal,
  getWeekRangeLocal,
} from "@/lib/dates";
import { formatDateVi } from "@/lib/students/format";
import type {
  AttendanceDaySummary,
  AttendanceEntryState,
  AttendanceHistoryFilter,
  AttendanceRecord,
  AttendanceStatus,
} from "@/types/attendance";

type AttendanceBoardProps = {
  classId: string;
  date: string;
  today: string;
  students: { id: string; full_name: string; student_code: string }[];
  savedRecords: AttendanceRecord[];
  historySummaries: AttendanceDaySummary[];
  sessionBasePath?: string;
};

function buildInitialEntries(
  students: AttendanceBoardProps["students"],
  savedRecords: AttendanceRecord[],
): AttendanceEntryState[] {
  const savedByStudent = new Map(savedRecords.map((record) => [record.student_id, record]));

  return students.map((student) => {
    const saved = savedByStudent.get(student.id);
    return {
      student_id: student.id,
      full_name: student.full_name,
      student_code: student.student_code,
      status: saved?.status ?? "PRESENT",
      note: saved?.note ?? "",
    };
  });
}

function recordsMap(records: AttendanceRecord[]): Record<string, AttendanceRecord> {
  return Object.fromEntries(records.map((record) => [record.student_id, record]));
}

export function AttendanceBoard({
  classId,
  date,
  today,
  students,
  savedRecords,
  historySummaries,
  sessionBasePath,
}: AttendanceBoardProps) {
  const router = useRouter();
  const listBasePath = sessionBasePath ?? `/classes/${classId}/session`;
  const [entries, setEntries] = useState(() => buildInitialEntries(students, savedRecords));
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<AttendanceHistoryFilter>("week");
  const [isSaving, startSaveTransition] = useTransition();

  const savedSnapshot = useMemo(() => recordsMap(savedRecords), [savedRecords]);

  const filteredHistory = useMemo(() => {
    if (historyFilter === "today") {
      return historySummaries.filter((item) => item.date === today);
    }
    if (historyFilter === "week") {
      const { start, end } = getWeekRangeLocal(today);
      return historySummaries.filter((item) => item.date >= start && item.date <= end);
    }
    const { start, end } = getMonthRangeLocal(today);
    return historySummaries.filter((item) => item.date >= start && item.date <= end);
  }, [historyFilter, historySummaries, today]);

  function updateEntry(studentId: string, patch: Partial<Pick<AttendanceEntryState, "status" | "note">>) {
    setEntries((current) =>
      current.map((entry) =>
        entry.student_id === studentId
          ? {
              ...entry,
              ...patch,
              note:
                patch.status && !attendanceNeedsNote(patch.status)
                  ? ""
                  : (patch.note ?? entry.note),
            }
          : entry,
      ),
    );
  }

  function markAllPresent() {
    setEntries((current) =>
      current.map((entry) => ({
        ...entry,
        status: "PRESENT" as AttendanceStatus,
        note: "",
      })),
    );
  }

  function handleSave() {
    startSaveTransition(async () => {
      setFeedback(null);
      setError(null);

      const payload: AttendanceRecord[] = entries.map(({ student_id, status, note }) => ({
        student_id,
        status,
        note,
      }));

      const result = await saveAttendance(classId, date, payload, savedSnapshot);

      if (result.error) {
        setError(result.error);
        return;
      }

      setFeedback(result.success ?? "Đã lưu điểm danh.");
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-3 flex flex-col gap-1.5 sm:flex-row">
        <Button className="h-9 flex-1" onClick={markAllPresent} type="button" variant="outline">
          Đánh dấu tất cả có mặt
        </Button>
        <Button className="h-9 flex-1" disabled={isSaving} onClick={handleSave} type="button">
          {isSaving ? "Đang lưu…" : "Lưu điểm danh"}
        </Button>
      </div>

      {feedback && (
        <p aria-live="polite" className="mb-2 text-sm text-emerald-600">
          {feedback}
        </p>
      )}
      {error && (
        <p aria-live="polite" className="mb-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {students.length === 0 ? (
        <Card>
          <CardContent className="py-4 text-center text-muted-foreground">
            Lớp chưa có học sinh.{" "}
            <Link className="font-medium text-primary hover:underline" href={`/classes/${classId}/students`}>
              Thêm học sinh
            </Link>{" "}
            trước khi điểm danh.
          </CardContent>
        </Card>
      ) : (
        <div className="divide-y rounded-lg border bg-card">
          {entries.map((entry) => (
            <div className="px-3 py-2" key={entry.student_id}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <div className="min-w-0 flex-1 sm:max-w-[45%]">
                  <p className="truncate text-sm font-semibold">{entry.full_name}</p>
                  <p className="text-xs text-muted-foreground">{entry.student_code}</p>
                </div>

                <div
                  aria-label={`Trạng thái điểm danh của ${entry.full_name}`}
                  className="grid grid-cols-4 gap-1 sm:flex-1"
                  role="group"
                >
                  {ATTENDANCE_STATUS_OPTIONS.map((option) => {
                    const isSelected = entry.status === option.value;

                    return (
                      <button
                        aria-pressed={isSelected}
                        aria-label={option.label}
                        className={`flex h-7 items-center justify-center gap-0.5 rounded-md border px-0.5 text-[11px] font-medium transition-colors ${
                          isSelected
                            ? option.buttonClass
                            : "border-transparent bg-muted/30 text-muted-foreground hover:border-border/60 hover:bg-muted/60"
                        }`}
                        key={option.value}
                        onClick={() => updateEntry(entry.student_id, { status: option.value })}
                        type="button"
                      >
                        <span aria-hidden="true" className="text-[9px] leading-none">
                          {option.emoji}
                        </span>
                        <span className="truncate leading-tight">{option.shortLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {attendanceNeedsNote(entry.status) && (
                <div className="mt-2 space-y-1">
                  <label
                    className="text-xs font-medium text-muted-foreground"
                    htmlFor={`note-${entry.student_id}`}
                  >
                    Ghi chú (tuỳ chọn)
                  </label>
                  <Input
                    className="h-8 text-sm"
                    id={`note-${entry.student_id}`}
                    onChange={(event) =>
                      updateEntry(entry.student_id, { note: event.target.value })
                    }
                    placeholder='Ví dụ: "Ốm", "Gia đình xin phép"'
                    value={entry.note}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <section className="mt-6">
        <h2 className="mb-2 text-lg font-bold">Lịch sử điểm danh</h2>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {(
            [
              ["today", "Hôm nay"],
              ["week", "Tuần này"],
              ["month", "Tháng này"],
            ] as const
          ).map(([value, label]) => (
            <Button
              className="h-8 px-3"
              key={value}
              onClick={() => setHistoryFilter(value)}
              type="button"
              variant={historyFilter === value ? "default" : "outline"}
            >
              {label}
            </Button>
          ))}
        </div>

        {filteredHistory.length === 0 ? (
          <Card>
            <CardContent className="py-3 text-sm text-muted-foreground">
              Chưa có dữ liệu điểm danh trong khoảng thời gian này.
            </CardContent>
          </Card>
        ) : (
          <div className="divide-y rounded-lg border bg-card">
            {filteredHistory.map((item) => (
              <div
                className="flex flex-col gap-1.5 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                key={item.date}
              >
                <div>
                  <p className="text-sm font-semibold">{formatDateVi(item.date)}</p>
                  <p className="text-xs text-muted-foreground">{item.total} học sinh</p>
                </div>
                <p className="text-xs font-medium">
                  {item.present} có mặt · {item.absent} vắng · {item.excused} có phép
                  {item.late > 0 ? ` · ${item.late} đi muộn` : ""}
                </p>
                {item.date !== date && (
                  <Button
                    className="h-8"
                    nativeButton={false}
                    render={
                      <Link href={`${listBasePath}?tab=attendance&date=${item.date}`} />
                    }
                    size="sm"
                    variant="outline"
                  >
                    Xem
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
