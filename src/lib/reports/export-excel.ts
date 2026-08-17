import * as XLSX from "xlsx";
import { formatReportRangeLabel } from "@/lib/reports/range";
import type { ClassReportData } from "@/types/reports";

export function downloadClassEvaluationReportExcel(report: ClassReportData) {
  const rows = [
    { "Nội dung": "Tổng số học sinh trong lớp", "Số lượng": report.activeStudents },
    { "Nội dung": "Số học sinh vắng", "Số lượng": report.absentStudents },
    { "Nội dung": "Số học sinh tốt", "Số lượng": report.evaluations.good },
    { "Nội dung": "Số học sinh khá", "Số lượng": report.evaluations.fair },
    { "Nội dung": "Số học sinh trung bình", "Số lượng": report.evaluations.average },
    { "Nội dung": "Số học sinh yếu", "Số lượng": report.evaluations.weak },
  ];

  const meta = [
    ["Lớp", report.className],
    ["Khoảng thời gian", formatReportRangeLabel(report.range)],
    ["Ghi chú", "Mức đánh giá lấy theo đánh giá tuần mới nhất của từng học sinh."],
    [],
  ];

  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet(meta);
  XLSX.utils.sheet_add_json(sheet, rows, { origin: -1 });
  XLSX.utils.book_append_sheet(workbook, sheet, "Bao_cao_lop");

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `bao_cao_${report.className.replace(/\s+/g, "_")}.xlsx`;
  anchor.click();
  URL.revokeObjectURL(url);
}
