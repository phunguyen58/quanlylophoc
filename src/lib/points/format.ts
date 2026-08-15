import type { PointValue, StudentPointTotals } from "@/types/points";

export const POINT_OPTIONS: PointValue[] = [1, 2, 5, -1, -2, -5];

export const DEFAULT_POINT_REASONS: Record<PointValue, string> = {
  1: "Làm bài tốt",
  2: "Hoàn thành tốt",
  5: "Thành tích xuất sắc",
  [-1]: "Không làm bài",
  [-2]: "Vi phạm nội quy",
  [-5]: "Vi phạm nghiêm trọng",
};

export function isPointValue(value: number): value is PointValue {
  return value === 1 || value === 2 || value === 5 || value === -1 || value === -2 || value === -5;
}

export function formatPointsTotal(total: number): string {
  if (total > 0) return `+${total}`;
  if (total < 0) return `${total}`;
  return "0";
}

export function formatPointsDelta(points: number): string {
  return points > 0 ? `+${points}` : `${points}`;
}

export function pointEventEmoji(points: number): string {
  if (points >= 2) return "🏆";
  if (points >= 1) return "⭐";
  return "⚠️";
}

export function needsNegativeConfirmation(points: number): boolean {
  return points === -2 || points === -5;
}

export function resolvePointReason(points: PointValue, customReason?: string): string {
  const trimmed = customReason?.trim();
  if (trimmed) return trimmed.slice(0, 500);
  return DEFAULT_POINT_REASONS[points];
}

export function aggregateStudentPointTotals(
  events: { student_id: string; points: number }[],
): StudentPointTotals {
  const totals: StudentPointTotals = {};

  for (const event of events) {
    totals[event.student_id] = (totals[event.student_id] ?? 0) + event.points;
  }

  return totals;
}

export function sumPointEvents(events: { points: number }[]): number {
  return events.reduce((total, event) => total + event.points, 0);
}
