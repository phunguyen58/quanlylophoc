import * as XLSX from "xlsx";
import type { ExcelStudentRow } from "@/types/student";
import { EXCEL_IMPORT_LIMITS, validateImportRowCount } from "@/lib/students/import-limits";

const TEMPLATE_HEADERS = ["student_code", "full_name", "date_of_birth", "gender", "notes"] as const;

const TEMPLATE_EXAMPLES = [
  {
    student_code: "HS001",
    full_name: "Nguyễn Văn Demo",
    date_of_birth: "2015-03-15",
    gender: "Nam",
    notes: "Ví dụ ghi chú",
  },
  {
    student_code: "HS002",
    full_name: "Trần Thị Mẫu",
    date_of_birth: "2015-07-20",
    gender: "Nữ",
    notes: "",
  },
  {
    student_code: "HS003",
    full_name: "Lê Văn Test",
    date_of_birth: "",
    gender: "",
    notes: "Không bắt buộc ngày sinh",
  },
];

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return String(value).trim();
}

export function buildStudentTemplateWorkbook(): ArrayBuffer {
  const worksheet = XLSX.utils.json_to_sheet(TEMPLATE_EXAMPLES, { header: [...TEMPLATE_HEADERS] });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Hoc_sinh");
  return XLSX.write(workbook, { bookType: "xlsx", type: "array" });
}

export function downloadStudentTemplate(): void {
  const buffer = buildStudentTemplateWorkbook();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "mau_danh_sach_hoc_sinh.xlsx";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function parseStudentExcelFile(buffer: ArrayBuffer): ExcelStudentRow[] {
  if (buffer.byteLength > EXCEL_IMPORT_LIMITS.maxFileSizeBytes) {
    throw new Error("File quá lớn. Kích thước tối đa là 2 MB.");
  }

  const workbook = XLSX.read(buffer, {
    type: "array",
    cellDates: true,
    sheetRows: EXCEL_IMPORT_LIMITS.maxSheetRows,
  });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("File Excel không có sheet dữ liệu.");
  }

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<(string | number | Date | null)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  if (matrix.length < 2) {
    throw new Error("File Excel chưa có dòng dữ liệu học sinh.");
  }

  if ((matrix[0]?.length ?? 0) > EXCEL_IMPORT_LIMITS.maxColumns) {
    throw new Error("File có quá nhiều cột. Vui lòng dùng file mẫu.");
  }

  const headerRow = matrix[0].map(normalizeHeader);
  const columnIndex = {
    studentCode: headerRow.indexOf("student_code"),
    fullName: headerRow.indexOf("full_name"),
    dateOfBirth: headerRow.indexOf("date_of_birth"),
    gender: headerRow.indexOf("gender"),
    notes: headerRow.indexOf("notes"),
  };

  if (columnIndex.studentCode === -1 || columnIndex.fullName === -1) {
    throw new Error("File thiếu cột bắt buộc: student_code, full_name.");
  }

  const rows: ExcelStudentRow[] = [];

  for (let index = 1; index < matrix.length; index += 1) {
    const row = matrix[index];
    const values = [
      columnIndex.studentCode >= 0 ? cellToString(row[columnIndex.studentCode]) : "",
      columnIndex.fullName >= 0 ? cellToString(row[columnIndex.fullName]) : "",
      columnIndex.dateOfBirth >= 0 ? cellToString(row[columnIndex.dateOfBirth]) : "",
      columnIndex.gender >= 0 ? cellToString(row[columnIndex.gender]) : "",
      columnIndex.notes >= 0 ? cellToString(row[columnIndex.notes]) : "",
    ];

    const isEmpty = values.every((value) => !value);
    if (isEmpty) continue;

    rows.push({
      rowNumber: index + 1,
      studentCode: values[0],
      fullName: values[1],
      dateOfBirth: values[2],
      gender: values[3],
      notes: values[4],
    });
  }

  const rowCountError = validateImportRowCount(rows.length);
  if (rowCountError) {
    throw new Error(rowCountError);
  }

  return rows;
}
