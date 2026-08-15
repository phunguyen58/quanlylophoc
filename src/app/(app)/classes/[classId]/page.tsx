import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, UsersRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getLocalDateString } from "@/lib/dates";
import { loadClassDashboardStats } from "@/lib/reports/load-report-data";
import { createClient } from "@/lib/supabase/server";
import { ClassDashboardSummary } from "./class-dashboard-summary";

export default async function ClassDetailPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const supabase = await createClient();
  const today = getLocalDateString();

  const { data: classItem } = await supabase
    .from("classes")
    .select("id, name, school_year, grade")
    .eq("id", classId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!classItem) notFound();

  const dashboardStats = await loadClassDashboardStats(supabase, classId, today);

  const actions = [
    {
      href: `/classes/${classId}/students`,
      icon: UsersRound,
      label: "Học sinh",
      description: "Thêm và quản lý danh sách",
      available: true,
    },
    {
      href: `/classes/${classId}/session`,
      icon: CalendarDays,
      label: "Quản lý buổi học",
      description: "Điểm danh và ghi nhận phát biểu",
      available: true,
    },
  ];

  return (
    <>
      <Link
        className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
        href="/dashboard"
      >
        <ArrowLeft className="size-4" />
        Tất cả lớp
      </Link>
      <header className="mb-4">
        <p className="text-xs text-muted-foreground">
          Khối {classItem.grade} · Năm học {classItem.school_year}
        </p>
        <h1 className="mt-0.5 text-2xl font-bold">{classItem.name}</h1>
      </header>

      <ClassDashboardSummary
        classId={classId}
        className={classItem.name}
        stats={dashboardStats}
      />

      <div className="grid gap-2.5 sm:grid-cols-2">
        {actions.map(({ href, icon: Icon, label, description, available }) => (
          <Link href={href} key={label}>
            <Card className="h-full transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md" size="sm">
              <CardContent>
                <Icon className="size-5 text-primary" />
                <h2 className="mt-2 text-base font-bold">{label}</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
                <p className="mt-2 text-xs font-semibold text-primary">
                  {available ? "Mở →" : "Sắp có →"}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
