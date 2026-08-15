import type { AttendanceDaySummary, AttendanceStatus } from "@/types/attendance";

export function summarizeDay(
  date: string,
  records: { status: AttendanceStatus }[],
  activeStudentCount: number,
): AttendanceDaySummary {
  let absent = 0;
  let excused = 0;
  let late = 0;

  for (const record of records) {
    if (record.status === "ABSENT") absent += 1;
    if (record.status === "EXCUSED") excused += 1;
    if (record.status === "LATE") late += 1;
  }

  const present = Math.max(activeStudentCount - absent - excused - late, 0);

  return {
    date,
    present,
    absent,
    excused,
    late,
    total: activeStudentCount,
  };
}
