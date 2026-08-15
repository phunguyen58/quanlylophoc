import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { attendanceStatusLabel } from "@/lib/attendance/format";
import { sumPointEvents, formatPointsTotal } from "@/lib/points/format";
import { loadStudentStatistics } from "@/lib/reports/load-report-data";
import { formatDateTimeVi, formatDateVi, genderLabel } from "@/lib/students/format";
import { createClient } from "@/lib/supabase/server";
import type { AttendanceStatus } from "@/types/attendance";
import { StudentPointsControls } from "../student-points-controls";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ classId: string; studentId: string }>;
}) {
  const { classId, studentId } = await params;
  const supabase = await createClient();

  const { data: classItem } = await supabase
    .from("classes")
    .select("id, name, school_year, grade")
    .eq("id", classId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!classItem) notFound();

  const { data: student } = await supabase
    .from("students")
    .select(
      "id, class_id, student_code, full_name, date_of_birth, gender, notes, created_at, updated_at",
    )
    .eq("id", studentId)
    .eq("class_id", classId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!student) notFound();

  const { data: attendanceHistory } = await supabase
    .from("attendance")
    .select("date, status, note")
    .eq("class_id", classId)
    .eq("student_id", studentId)
    .order("date", { ascending: false })
    .limit(10);

  const { data: participationHistory } = await supabase
    .from("participation_events")
    .select("id, created_at, points, event_type")
    .eq("class_id", classId)
    .eq("student_id", studentId)
    .eq("event_type", "PARTICIPATION")
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: allPointEvents } = await supabase
    .from("student_points")
    .select("points")
    .eq("class_id", classId)
    .eq("student_id", studentId);

  const { data: pointHistory } = await supabase
    .from("student_points")
    .select("id, points, reason, created_at")
    .eq("class_id", classId)
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(20);

  const pointTotal = sumPointEvents(allPointEvents ?? []);
  const statistics = await loadStudentStatistics(supabase, classId, studentId);

  return (
    <>
      <Link
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
        href={`/classes/${classId}/students`}
      >
        <ArrowLeft className="size-4" />
        Danh sách học sinh
      </Link>

      <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {classItem.name} · Khối {classItem.grade}
          </p>
          <h1 className="mt-1 text-3xl font-bold">{student.full_name}</h1>
          <p className="mt-2 text-muted-foreground">Mã học sinh: {student.student_code}</p>
        </div>
        <Button
          className="h-11"
          nativeButton={false}
          render={<Link href={`/classes/${classId}/students?edit=${student.id}`} />}
        >
          <Pencil className="size-4" />
          Sửa thông tin
        </Button>
      </header>

      <Card>
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
          <DetailField label="Họ tên" value={student.full_name} />
          <DetailField label="Mã học sinh" value={student.student_code} />
          <DetailField label="Ngày sinh" value={formatDateVi(student.date_of_birth)} />
          <DetailField label="Giới tính" value={genderLabel(student.gender)} />
          <DetailField label="Lớp" value={classItem.name} />
          <DetailField label="Ngày thêm" value={formatDateTimeVi(student.created_at)} />
          <div className="space-y-1 sm:col-span-2">
            <p className="text-sm font-medium text-muted-foreground">Ghi chú</p>
            <p className="text-base">{student.notes || "—"}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="grid gap-4 p-5 sm:grid-cols-3">
          <DetailField
            label="Tỷ lệ có mặt"
            value={
              statistics.attendanceRate === null
                ? "—"
                : `${statistics.attendanceRate}% (${statistics.attendanceDaysRecorded} ngày ghi nhận)`
            }
          />
          <DetailField label="Phát biểu" value={`${statistics.participationCount} lượt`} />
          <DetailField label="Tổng điểm" value={formatPointsTotal(statistics.pointsTotal)} />
        </CardContent>
      </Card>

      <Card className="mt-4" id="points">
        <CardContent className="p-5">
          <StudentPointsControls
            classId={classId}
            initialHistory={pointHistory ?? []}
            initialTotal={pointTotal}
            studentId={student.id}
            studentName={student.full_name}
            variant="detail"
          />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="p-5">
          <p className="text-sm font-medium text-muted-foreground">Lịch sử phát biểu gần đây</p>
          {participationHistory?.length ? (
            <ul className="mt-3 space-y-2">
              {participationHistory.map((record) => (
                <li
                  className="flex flex-col gap-1 rounded-lg border px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                  key={record.id}
                >
                  <span className="font-medium">{formatDateTimeVi(record.created_at)}</span>
                  <span>{record.points > 0 ? "💬 Phát biểu +1" : "↩️ Hoàn tác phát biểu"}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Chưa có dữ liệu phát biểu.</p>
          )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="p-5">
          <p className="text-sm font-medium text-muted-foreground">Lịch sử điểm danh gần đây</p>
          {attendanceHistory?.length ? (
            <ul className="mt-3 space-y-2">
              {attendanceHistory.map((record) => (
                <li
                  className="flex flex-col gap-1 rounded-lg border px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                  key={String(record.date)}
                >
                  <span className="font-medium">{formatDateVi(String(record.date))}</span>
                  <span>{attendanceStatusLabel(record.status as AttendanceStatus)}</span>
                  {record.note ? (
                    <span className="text-muted-foreground sm:text-right">{record.note}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Chưa có dữ liệu điểm danh.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-base font-medium">{value}</p>
    </div>
  );
}
