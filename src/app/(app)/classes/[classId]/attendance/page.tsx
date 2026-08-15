import { redirect } from "next/navigation";
import { getLocalDateString, isFutureDateString, isIsoDateString } from "@/lib/dates";

export default async function ClassAttendanceRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { classId } = await params;
  const { date: dateParam } = await searchParams;
  const today = getLocalDateString();

  let date = today;
  if (dateParam && isIsoDateString(dateParam) && !isFutureDateString(dateParam, today)) {
    date = dateParam;
  }

  redirect(`/classes/${classId}/session?tab=attendance&date=${date}`);
}
