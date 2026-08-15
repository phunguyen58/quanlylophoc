import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ClassDashboardStats } from "@/types/reports";

export function ClassDashboardSummary({
  classId,
  className,
  stats,
}: {
  classId: string;
  className: string;
  stats: ClassDashboardStats;
}) {
  return (
    <Card className="mb-4" size="sm">
      <CardContent>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Tổng quan hôm nay</p>
            <h2 className="text-lg font-bold">{className}</h2>
            <p className="text-sm text-muted-foreground">{stats.activeStudents} học sinh</p>
          </div>
          <Button
            className="h-9"
            nativeButton={false}
            render={<Link href={`/classes/${classId}/reports`} />}
          >
            <BarChart3 className="size-4" />
            Xem báo cáo
          </Button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <SummaryItem label="🟢 Có mặt" value={String(stats.presentToday)} />
          <SummaryItem label="🔴 Vắng" value={String(stats.absentToday)} />
          <SummaryItem label="🟡 Có phép" value={String(stats.excusedToday)} />
          <SummaryItem label="🟠 Đi muộn" value={String(stats.lateToday)} />
          <SummaryItem label="💬 Phát biểu hôm nay" value={`${stats.participationToday} lượt`} />
          <SummaryItem label="⭐ Điểm tuần này" value={String(stats.pointsThisWeek)} />
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-slate-50 p-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-bold">{value}</p>
    </div>
  );
}
