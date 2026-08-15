import * as XLSX from "xlsx";
import { weeklyAttendanceStatusLabel } from "@/lib/attendance/format";
import { weekLabel } from "@/lib/weeks";
import type { AttendanceStatus } from "@/types/attendance";

export type WeekExportStudent = {
  student_code: string;
  full_name: string;
  status?: AttendanceStatus | null;
  level?: string | null;
  comment?: string | null;
};

/** Export toàn bộ học sinh của lớp trong một tuần (không phụ thuộc học sinh đang chọn trên UI). */
export function downloadWeekReportExcel(input: {
  className: string;
  schoolYear: string;
  week: number;
  startDate?: string | null;
  endDate?: string | null;
  students: WeekExportStudent[];
}) {
  const sorted = [...input.students].sort((a, b) =>
    a.full_name.localeCompare(b.full_name, "vi", { sensitivity: "base" }),
  );

  const rows = sorted.map((student, index) => ({
    STT: index + 1,
    "Mã học sinh": student.student_code,
    "Họ và tên": student.full_name,
    "Điểm danh": student.status ? weeklyAttendanceStatusLabel(student.status) : "",
    "Đánh giá": student.level ?? "",
    "Nhận xét": student.comment ?? "",
  }));

  const meta = [
    ["Lớp", input.className],
    ["Năm học", input.schoolYear],
    ["Tuần", weekLabel(input.week)],
    ["Từ ngày", input.startDate ?? ""],
    ["Đến ngày", input.endDate ?? ""],
    [],
  ];

  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet(meta);
  XLSX.utils.sheet_add_json(sheet, rows, { origin: -1 });
  XLSX.utils.book_append_sheet(workbook, sheet, `Tuan_${input.week}`);

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `bao_cao_${input.className.replace(/\s+/g, "_")}_tuan_${input.week}.xlsx`;
  anchor.click();
  URL.revokeObjectURL(url);
}
