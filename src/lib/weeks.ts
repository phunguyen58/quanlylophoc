/** School-year calendar helpers. Weeks are 1–35 (not hard-coded in UI components). */

export const TOTAL_WEEKS = 35 as const;

export type WeekNumber = number;

export function weekNumbers(): number[] {
  return Array.from({ length: TOTAL_WEEKS }, (_, index) => index + 1);
}

export function isValidWeekNumber(week: number): boolean {
  return Number.isInteger(week) && week >= 1 && week <= TOTAL_WEEKS;
}

export function clampWeekNumber(week: number): number {
  if (!Number.isFinite(week)) return 1;
  return Math.min(TOTAL_WEEKS, Math.max(1, Math.trunc(week)));
}

/**
 * Estimate current teaching week from school-year label `YYYY-YYYY`.
 * Vietnam elementary years typically start around 1 September.
 */
export function estimateCurrentWeek(schoolYearName: string, now = new Date()): number {
  const startYear = Number.parseInt(schoolYearName.slice(0, 4), 10);
  if (!Number.isFinite(startYear)) return 1;

  const start = new Date(startYear, 8, 1); // 1 Sep local
  const diffMs = now.getTime() - start.getTime();
  if (diffMs < 0) return 1;

  const week = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;
  return clampWeekNumber(week);
}

export function weekLabel(week: number): string {
  return `Tuần ${week}`;
}
