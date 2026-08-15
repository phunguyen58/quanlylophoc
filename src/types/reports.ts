export type ReportFilter = "today" | "week" | "month" | "custom";

export type DateRange = {
  start: string;
  end: string;
};

export type ClassDashboardStats = {
  activeStudents: number;
  presentToday: number;
  absentToday: number;
  excusedToday: number;
  lateToday: number;
  participationToday: number;
  pointsThisWeek: number;
};

export type RankingEntry = {
  studentId: string;
  studentName: string;
  value: number;
};

export type ClassReportData = {
  className: string;
  range: DateRange;
  filter: ReportFilter;
  activeStudents: number;
  attendance: {
    present: number;
    absent: number;
    excused: number;
    late: number;
  };
  participationTotal: number;
  pointsTotal: number;
  topParticipation: RankingEntry[];
  topPoints: RankingEntry[];
  mostAbsent: RankingEntry[];
};

export type StudentStatistics = {
  attendanceRate: number | null;
  participationCount: number;
  pointsTotal: number;
  attendanceDaysRecorded: number;
};
