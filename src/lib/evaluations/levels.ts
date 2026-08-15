/**
 * Default weekly evaluation levels (suggestions only).
 * Teachers may type a custom level; do not hard-code these in DB constraints.
 */
export const DEFAULT_EVALUATION_LEVELS = [
  "Tốt",
  "Khá",
  "Trung bình",
  "Yếu",
] as const;

export type DefaultEvaluationLevel = (typeof DEFAULT_EVALUATION_LEVELS)[number];

export function evaluationLevelOptions(custom?: string[] | null): string[] {
  const fromCustom = (custom ?? []).map((item) => item.trim()).filter(Boolean);
  if (fromCustom.length > 0) return Array.from(new Set(fromCustom));
  return [...DEFAULT_EVALUATION_LEVELS];
}
