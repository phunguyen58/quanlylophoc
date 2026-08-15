import { redirect } from "next/navigation";
import { clampWeekNumber, isValidWeekNumber } from "@/lib/weeks";

/** Deep link cũ → mở tuần ngay trên trang lớp (xổ danh sách, không tách trang). */
export default async function WeekPage({
  params,
}: {
  params: Promise<{ classId: string; week: string }>;
}) {
  const { classId, week: weekParam } = await params;
  const weekNumber = Number.parseInt(weekParam, 10);
  const week = isValidWeekNumber(weekNumber) ? clampWeekNumber(weekNumber) : 1;
  redirect(`/classes/${classId}?week=${week}`);
}
