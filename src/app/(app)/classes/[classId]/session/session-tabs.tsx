"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AttendanceBoard } from "../attendance/attendance-board";
import { ParticipationBoard } from "../participation/participation-board";
import { Button } from "@/components/ui/button";
import {
  addDaysToDateString,
  formatDateLabelVi,
  formatDateNavButtonLabel,
  isFutureDateString,
} from "@/lib/dates";
import type { AttendanceDaySummary, AttendanceRecord } from "@/types/attendance";
import type { ParticipationCounts } from "@/types/participation";

export type SessionTab = "attendance" | "participation";

type SessionTabsProps = {
  classId: string;
  className: string;
  date: string;
  today: string;
  initialTab: SessionTab;
  students: { id: string; full_name: string; student_code: string }[];
  savedRecords: AttendanceRecord[];
  historySummaries: AttendanceDaySummary[];
  initialCounts: ParticipationCounts;
  attendanceBoardKey: string;
  participationBoardKey: string;
};

const TABS: { value: SessionTab; label: string }[] = [
  { value: "attendance", label: "Điểm danh" },
  { value: "participation", label: "Phát biểu" },
];

function buildSessionUrl(classId: string, tab: SessionTab, date: string) {
  const params = new URLSearchParams({ tab, date });
  return `/classes/${classId}/session?${params.toString()}`;
}

export function SessionTabs({
  classId,
  className,
  date,
  today,
  initialTab,
  students,
  savedRecords,
  historySummaries,
  initialCounts,
  attendanceBoardKey,
  participationBoardKey,
}: SessionTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") as SessionTab | null) ?? initialTab;
  const safeTab = TABS.some((tab) => tab.value === activeTab) ? activeTab : "attendance";

  const previousDate = addDaysToDateString(date, -1);
  const nextDate = addDaysToDateString(date, 1);
  const canGoNext = !isFutureDateString(nextDate, today);
  const isToday = date === today;
  const todayButtonLabel = formatDateNavButtonLabel(today, today);
  const previousButtonLabel = formatDateNavButtonLabel(previousDate, today);
  const nextButtonLabel = formatDateNavButtonLabel(nextDate, today);

  function navigateDate(targetDate: string) {
    if (isFutureDateString(targetDate, today)) return;
    router.push(buildSessionUrl(classId, safeTab, targetDate));
  }

  function setTab(tab: SessionTab) {
    router.push(buildSessionUrl(classId, tab, date));
  }

  return (
    <>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Lớp {className}</p>
          <p className="text-lg font-bold">{formatDateLabelVi(date, today)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            aria-label={`Xem ngày ${previousButtonLabel}`}
            className="h-9 gap-1.5 px-2.5 text-xs sm:text-sm"
            onClick={() => navigateDate(previousDate)}
            type="button"
            variant="outline"
          >
            <ChevronLeft className="size-4 shrink-0" />
            <span>{previousButtonLabel}</span>
          </Button>
          <Button
            aria-current={isToday ? "date" : undefined}
            className="h-9 px-2.5 text-xs sm:text-sm"
            onClick={() => navigateDate(today)}
            type="button"
            variant={isToday ? "default" : "outline"}
          >
            {todayButtonLabel}
          </Button>
          <Button
            aria-disabled={!canGoNext}
            aria-label={
              canGoNext
                ? `Xem ngày ${nextButtonLabel}`
                : "Không thể xem ngày trong tương lai"
            }
            className="h-9 gap-1.5 px-2.5 text-xs sm:text-sm"
            disabled={!canGoNext}
            onClick={() => navigateDate(nextDate)}
            title={canGoNext ? undefined : "Chưa thể xem ngày trong tương lai"}
            type="button"
            variant="outline"
          >
            <span>{nextButtonLabel}</span>
            <ChevronRight className="size-4 shrink-0" />
          </Button>
        </div>
      </div>

      <div
        aria-label="Chọn nội dung buổi học"
        className="mb-3 flex gap-1 rounded-lg border bg-muted/30 p-1"
        role="tablist"
      >
        {TABS.map((tab) => (
          <button
            aria-selected={safeTab === tab.value}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              safeTab === tab.value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            key={tab.value}
            onClick={() => setTab(tab.value)}
            role="tab"
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {safeTab === "attendance" ? (
        <AttendanceBoard
          key={attendanceBoardKey}
          classId={classId}
          date={date}
          historySummaries={historySummaries}
          savedRecords={savedRecords}
          sessionBasePath={`/classes/${classId}/session`}
          students={students}
          today={today}
        />
      ) : (
        <ParticipationBoard
          key={participationBoardKey}
          classId={classId}
          initialCounts={initialCounts}
          students={students}
        />
      )}
    </>
  );
}
