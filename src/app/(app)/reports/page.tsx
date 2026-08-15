import Link from "next/link";
import { BarChart3, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function ReportsHubPage() {
  const supabase = await createClient();
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, school_year, grade")
    .is("deleted_at", null)
    .order("school_year", { ascending: false })
    .order("name");

  return (
    <>
      <header className="mb-4">
        <p className="text-sm text-muted-foreground">Tổng hợp</p>
        <h1 className="text-2xl font-bold">Báo cáo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chọn lớp để xem báo cáo chuyên cần / phát biểu / điểm thi đua.
        </p>
      </header>

      {!classes?.length ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            Chưa có lớp để xem báo cáo.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((classItem) => (
            <Link href={`/classes/${classItem.id}/reports`} key={classItem.id}>
              <Card className="h-full transition hover:border-primary/40 hover:shadow-md" size="sm">
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-lg font-bold text-primary">{classItem.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {classItem.school_year} · Khối {classItem.grade}
                      </p>
                    </div>
                    <BarChart3 className="size-5 text-sky-500" />
                  </div>
                  <p className="mt-3 text-xs font-semibold text-primary">Xem báo cáo →</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Card className="mt-4" size="sm">
        <CardContent className="flex items-start gap-3">
          <GraduationCap className="mt-0.5 size-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Báo cáo tuần (điểm danh + đánh giá) nằm trong từng lớp → chọn tuần → Xuất Excel.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
