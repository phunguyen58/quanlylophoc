import { redirect } from "next/navigation";

export default async function WeeklyRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ week?: string }>;
}) {
  const { classId } = await params;
  const { week } = await searchParams;
  const parsed = Number.parseInt(week ?? "1", 10);
  const safeWeek = Number.isFinite(parsed) && parsed >= 1 && parsed <= 35 ? parsed : 1;
  redirect(`/classes/${classId}?week=${safeWeek}`);
}
