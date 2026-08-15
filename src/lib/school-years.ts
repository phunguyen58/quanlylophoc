import { z } from "zod";

/** YYYY-YYYY and end year must be start year + 1. */
export const schoolYearNameSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{4}$/, "Dùng định dạng năm học 2026-2027.")
  .superRefine((value, ctx) => {
    const start = Number.parseInt(value.slice(0, 4), 10);
    const end = Number.parseInt(value.slice(5, 9), 10);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end !== start + 1) {
      ctx.addIssue({
        code: "custom",
        message: "Năm học phải liền nhau, ví dụ 2026-2027 (không phải 2026-2026 hay 2027-2026).",
      });
    }
  });

export function parseSchoolYearStart(name: string): number | null {
  const year = Number.parseInt(name.slice(0, 4), 10);
  return Number.isFinite(year) ? year : null;
}

/** School-year start for Vietnam: before September, current year often began previous calendar year. */
export function currentSchoolYearStart(now = new Date()): number {
  return now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
}

/** Default when creating: always 2026-2027. */
export const DEFAULT_SCHOOL_YEAR_START = 2026;
/** Last selectable start year in create form (2040-2041). */
export const MAX_SCHOOL_YEAR_START = 2040;

/** Default label when creating a school year. */
export function defaultNewSchoolYearName(): string {
  return `${DEFAULT_SCHOOL_YEAR_START}-${DEFAULT_SCHOOL_YEAR_START + 1}`;
}

/**
 * Options for create-year picker: 2026-2027 … 2040-2041 (ascending).
 */
export function nearbySchoolYearOptions(): string[] {
  const options: string[] = [];
  for (let start = DEFAULT_SCHOOL_YEAR_START; start <= MAX_SCHOOL_YEAR_START; start += 1) {
    options.push(`${start}-${start + 1}`);
  }
  return options;
}

/** Sort school-year labels by start year descending (newest first). */
export function sortSchoolYearNamesDesc(names: string[]): string[] {
  return [...names].sort((a, b) => {
    const sa = parseSchoolYearStart(a) ?? 0;
    const sb = parseSchoolYearStart(b) ?? 0;
    return sb - sa;
  });
}

export function sortBySchoolYearNameDesc<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const sa = parseSchoolYearStart(a.name) ?? 0;
    const sb = parseSchoolYearStart(b.name) ?? 0;
    return sb - sa;
  });
}

/** Sort by start year ascending: 2024-2025 → 2025-2026 → 2026-2027. */
export function sortBySchoolYearNameAsc<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const sa = parseSchoolYearStart(a.name) ?? 0;
    const sb = parseSchoolYearStart(b.name) ?? 0;
    return sa - sb;
  });
}
