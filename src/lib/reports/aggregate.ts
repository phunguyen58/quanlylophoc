import { summarizeDay } from "@/lib/attendance/summary";
import { aggregateParticipationCounts } from "@/lib/participation/summary";
import { aggregateStudentPointTotals } from "@/lib/points/format";
import type { AttendanceStatus } from "@/types/attendance";
import type { ClassReportData, DateRange, RankingEntry, StudentStatistics } from "@/types/reports";
import type { ReportFilter } from "@/types/reports";

const RANKING_LIMIT = 5;

type StudentRow = { id: string; full_name: string };

function buildRankings(
  students: StudentRow[],
  participationCounts: Record<string, number>,
  pointTotals: Record<string, number>,
  absentDayCounts: Record<string, number>,
): Pick<ClassReportData, "topParticipation" | "topPoints" | "mostAbsent"> {
  const nameById = new Map(students.map((student) => [student.id, student.full_name]));

  function toRanking(counts: Record<string, number>, minValue = 1): RankingEntry[] {
    return Object.entries(counts)
      .filter(([, value]) => value >= minValue)
      .sort(([, a], [, b]) => b - a)
      .slice(0, RANKING_LIMIT)
      .map(([studentId, value]) => ({
        studentId,
        studentName: nameById.get(studentId) ?? "Học sinh",
        value,
      }));
  }

  return {
    topParticipation: toRanking(participationCounts),
    topPoints: toRanking(
      Object.fromEntries(Object.entries(pointTotals).filter(([, value]) => value > 0)),
    ),
    mostAbsent: toRanking(absentDayCounts),
  };
}

function countAbsentDaysByStudent(
  rows: { student_id: string; date: string; status: AttendanceStatus }[],
): Record<string, number> {
  const absentDays = new Map<string, Set<string>>();

  for (const row of rows) {
    if (row.status !== "ABSENT") continue;
    const dates = absentDays.get(row.student_id) ?? new Set<string>();
    dates.add(String(row.date));
    absentDays.set(row.student_id, dates);
  }

  return Object.fromEntries(
    [...absentDays.entries()].map(([studentId, dates]) => [studentId, dates.size]),
  );
}

function sumParticipationTotal(counts: Record<string, number>): number {
  return Object.values(counts).reduce((total, count) => total + count, 0);
}

function sumPointTotal(totals: Record<string, number>): number {
  return Object.values(totals).reduce((total, points) => total + points, 0);
}

export function buildClassReport(input: {
  className: string;
  filter: ReportFilter;
  range: DateRange;
  students: StudentRow[];
  attendanceRows: { student_id: string; date: string; status: AttendanceStatus }[];
  participationRows: { student_id: string; points: number }[];
  pointRows: { student_id: string; points: number }[];
}): ClassReportData {
  const activeStudents = input.students.length;
  const isSingleDay = input.range.start === input.range.end;

  let attendanceSummary = { present: 0, absent: 0, excused: 0, late: 0 };

  if (isSingleDay) {
    const daySummary = summarizeDay(
      input.range.start,
      input.attendanceRows.map((row) => ({ status: row.status })),
      activeStudents,
    );
    attendanceSummary = {
      present: daySummary.present,
      absent: daySummary.absent,
      excused: daySummary.excused,
      late: daySummary.late,
    };
  } else {
    for (const row of input.attendanceRows) {
      if (row.status === "PRESENT") attendanceSummary.present += 1;
      if (row.status === "ABSENT") attendanceSummary.absent += 1;
      if (row.status === "EXCUSED") attendanceSummary.excused += 1;
      if (row.status === "LATE") attendanceSummary.late += 1;
    }
  }

  const participationCounts = aggregateParticipationCounts(input.participationRows);
  const pointTotals = aggregateStudentPointTotals(input.pointRows);
  const absentDayCounts = countAbsentDaysByStudent(input.attendanceRows);
  const rankings = buildRankings(input.students, participationCounts, pointTotals, absentDayCounts);

  return {
    className: input.className,
    filter: input.filter,
    range: input.range,
    activeStudents,
    attendance: attendanceSummary,
    participationTotal: sumParticipationTotal(participationCounts),
    pointsTotal: sumPointTotal(pointTotals),
    ...rankings,
  };
}

export function buildStudentStatistics(input: {
  attendanceRows: { status: AttendanceStatus }[];
  participationCount: number;
  pointsTotal: number;
}): StudentStatistics {
  const attendanceDaysRecorded = input.attendanceRows.length;
  let attendanceRate: number | null = null;

  if (attendanceDaysRecorded > 0) {
    const attended = input.attendanceRows.filter(
      (row) => row.status === "PRESENT" || row.status === "LATE",
    ).length;
    attendanceRate = Math.round((attended / attendanceDaysRecorded) * 100);
  }

  return {
    attendanceRate,
    participationCount: input.participationCount,
    pointsTotal: input.pointsTotal,
    attendanceDaysRecorded,
  };
}

export function buildTodayDashboard(input: {
  activeStudents: number;
  today: string;
  todayAttendance: { status: AttendanceStatus }[];
  participationToday: number;
  pointsThisWeek: number;
}) {
  const summary = summarizeDay(input.today, input.todayAttendance, input.activeStudents);

  return {
    activeStudents: input.activeStudents,
    presentToday: summary.present,
    absentToday: summary.absent,
    excusedToday: summary.excused,
    lateToday: summary.late,
    participationToday: input.participationToday,
    pointsThisWeek: input.pointsThisWeek,
  };
}
