export type AttendanceStatus = "PRESENT" | "ABSENT" | "EXCUSED" | "LATE";

export type AttendanceRecord = {
  student_id: string;
  status: AttendanceStatus;
  note: string;
};

export type AttendanceEntryState = AttendanceRecord & {
  full_name: string;
  student_code: string;
};

export type AttendanceDaySummary = {
  date: string;
  present: number;
  absent: number;
  excused: number;
  late: number;
  total: number;
};

export type AttendanceHistoryFilter = "today" | "week" | "month";
