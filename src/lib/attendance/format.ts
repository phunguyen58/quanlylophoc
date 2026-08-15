import type { AttendanceStatus } from "@/types/attendance";

export const ATTENDANCE_STATUS_OPTIONS: {
  value: AttendanceStatus;
  label: string;
  emoji: string;
  shortLabel: string;
  buttonClass: string;
}[] = [
  {
    value: "PRESENT",
    label: "Có mặt",
    emoji: "🟢",
    shortLabel: "Có mặt",
    buttonClass: "border-emerald-200/70 bg-emerald-50/70 text-emerald-700 ring-1 ring-emerald-200/50",
  },
  {
    value: "ABSENT",
    label: "Vắng không phép",
    emoji: "🔴",
    shortLabel: "Vắng KP",
    buttonClass: "border-red-200/70 bg-red-50/70 text-red-700 ring-1 ring-red-200/50",
  },
  {
    value: "EXCUSED",
    label: "Vắng có phép",
    emoji: "🟡",
    shortLabel: "Vắng CP",
    buttonClass: "border-amber-200/70 bg-amber-50/60 text-amber-800 ring-1 ring-amber-200/50",
  },
  {
    value: "LATE",
    label: "Đi muộn",
    emoji: "🟠",
    shortLabel: "Muộn",
    buttonClass: "border-orange-200/70 bg-orange-50/60 text-orange-800 ring-1 ring-orange-200/50",
  },
];

/** Điểm danh tuần trên trang lớp: chỉ Có mặt / Vắng. */
export const WEEKLY_ATTENDANCE_STATUS_OPTIONS = [
  {
    value: "PRESENT" as const,
    label: "Có mặt",
  },
  {
    value: "ABSENT" as const,
    label: "Vắng",
  },
];

export type WeeklyAttendanceStatus = (typeof WEEKLY_ATTENDANCE_STATUS_OPTIONS)[number]["value"];

/** Gộp các trạng thái cũ (có phép / muộn) về Vắng khi dùng UI 2 lựa chọn. */
export function toWeeklyAttendanceStatus(status: AttendanceStatus): WeeklyAttendanceStatus {
  return status === "PRESENT" ? "PRESENT" : "ABSENT";
}

export function weeklyAttendanceStatusLabel(status: AttendanceStatus): string {
  return toWeeklyAttendanceStatus(status) === "PRESENT" ? "Có mặt" : "Vắng";
}

export function attendanceStatusMeta(status: AttendanceStatus) {
  return (
    ATTENDANCE_STATUS_OPTIONS.find((option) => option.value === status) ??
    ATTENDANCE_STATUS_OPTIONS[0]
  );
}

export function attendanceStatusLabel(status: AttendanceStatus): string {
  return attendanceStatusMeta(status).label;
}

export function attendanceNeedsNote(status: AttendanceStatus): boolean {
  return status === "ABSENT" || status === "EXCUSED" || status === "LATE";
}
