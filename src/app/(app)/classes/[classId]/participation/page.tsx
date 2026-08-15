import { redirect } from "next/navigation";
import { getLocalDateString } from "@/lib/dates";

export default async function ClassParticipationRedirect({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const today = getLocalDateString();
  redirect(`/classes/${classId}/session?tab=participation&date=${today}`);
}
