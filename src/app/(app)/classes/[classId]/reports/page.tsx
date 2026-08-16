import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getLocalDateString } from "@/lib/dates";
import { loadClassReport } from "@/lib/reports/load-report-data";
import { parseReportFilter, resolveReportRange } from "@/lib/reports/range";
import { createClient } from "@/lib/supabase/server";
import { ClassReportView } from "./class-report-view";
import { ReportFilters } from "./report-filters";

export default async function ClassReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ filter?: string; from?: string; to?: string }>;
}) {
  const { classId } = await params;
  const { filter: filterParam, from, to } = await searchParams;
  const today = getLocalDateString();
  const filter = parseReportFilter(filterParam);

  const range = resolveReportRange(filter, { today, from, to });
  if (!range) {
    redirect(`/classes/${classId}/reports?filter=today`);
  }

  const supabase = await createClient();

  const { data: classItem } = await supabase
    .from("classes")
    .select("id, name, school_year, grade")
    .eq("id", classId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!classItem) notFound();

  const report = await loadClassReport(supabase, classId, classItem.name, filter, range);
  return (
    <>
      <Link
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
        href={`/classes/${classId}`}
      >
        <ArrowLeft className="size-4" />
        Quay lại lớp {classItem.name}
      </Link>

      <header className="mb-7">
        <p className="text-sm text-muted-foreground">
          Khối {classItem.grade} · Năm học {classItem.school_year}
        </p>
        <h1 className="mt-1 text-3xl font-bold">Báo cáo — {classItem.name}</h1>
        <p className="mt-2 text-muted-foreground">Tổng hợp sĩ số, chuyên cần và đánh giá học sinh</p>
      </header>

      <ReportFilters classId={classId} filter={filter} range={range} />
      <ClassReportView report={report} />
    </>
  );
}
