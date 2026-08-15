/** MVP limits for client-side Excel import. */
export const EXCEL_IMPORT_LIMITS = {
  maxFileSizeBytes: 2 * 1024 * 1024,
  maxRows: 200,
  maxSheetRows: 201,
  maxColumns: 20,
  allowedExtensions: [".xlsx", ".xls"] as const,
} as const;

export function validateExcelUploadFile(file: File): string | null {
  if (file.size === 0) {
    return "File Excel trống. Vui lòng chọn file khác.";
  }

  if (file.size > EXCEL_IMPORT_LIMITS.maxFileSizeBytes) {
    return "File quá lớn. Kích thước tối đa là 2 MB.";
  }

  const lowerName = file.name.toLowerCase();
  const hasAllowedExtension = EXCEL_IMPORT_LIMITS.allowedExtensions.some((ext) =>
    lowerName.endsWith(ext),
  );

  if (!hasAllowedExtension) {
    return "Chỉ hỗ trợ file .xlsx hoặc .xls.";
  }

  return null;
}

export function validateImportRowCount(rowCount: number): string | null {
  if (rowCount === 0) {
    return "Không tìm thấy dòng học sinh hợp lệ trong file.";
  }

  if (rowCount > EXCEL_IMPORT_LIMITS.maxRows) {
    return `File có quá nhiều học sinh. Tối đa ${EXCEL_IMPORT_LIMITS.maxRows} dòng mỗi lần nhập.`;
  }

  return null;
}
