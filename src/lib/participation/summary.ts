import type { ParticipationCounts } from "@/types/participation";

export function aggregateParticipationCounts(
  events: { student_id: string; points: number }[],
): ParticipationCounts {
  const counts: ParticipationCounts = {};

  for (const event of events) {
    counts[event.student_id] = Math.max(0, (counts[event.student_id] ?? 0) + event.points);
  }

  return counts;
}
