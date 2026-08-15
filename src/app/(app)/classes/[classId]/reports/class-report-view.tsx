import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { formatPointsTotal } from "@/lib/points/format";
import { formatReportRangeLabel } from "@/lib/reports/range";
import type { ClassReportData, RankingEntry } from "@/types/reports";

type ClassReportViewProps = {
  report: ClassReportData;
  classId: string;
  isSingleDay: boolean;
};

function RankingList({
  title,
  description,
  items,
  valueLabel,
}: {
  title: string;
  description: string;
  items: RankingEntry[];
  valueLabel: (value: number) => string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        {items.length ? (
          <ol className="mt-4 space-y-2">
            {items.map((item, index) => (
              <li
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                key={item.studentId}
              >
                <span>
                  {index + 1}. {item.studentName}
                </span>
                <span className="font-semibold">{valueLabel(item.value)}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">Chưa có dữ liệu trong khoảng thời gian này.</p>
        )}
      </CardContent>
    </Card>
  );
}

export function ClassReportView({ report, classId, isSingleDay }: ClassReportViewProps) {
  return (
    <>
      <Card className="mb-6">
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatBlock label="Học sinh" value={`${report.activeStudents}`} />
          {isSingleDay ? (
            <>
              <StatBlock label="🟢 Có mặt" value={`${report.attendance.present}`} />
              <StatBlock label="🔴 Vắng" value={`${report.attendance.absent}`} />
              <StatBlock label="🟡 Có phép" value={`${report.attendance.excused}`} />
              <StatBlock label="🟠 Đi muộn" value={`${report.attendance.late}`} />
            </>
          ) : (
            <>
              <StatBlock label="Lượt có mặt" value={`${report.attendance.present}`} />
              <StatBlock label="Lượt vắng" value={`${report.attendance.absent}`} />
              <StatBlock label="Lượt có phép" value={`${report.attendance.excused}`} />
              <StatBlock label="Lượt đi muộn" value={`${report.attendance.late}`} />
            </>
          )}
          <StatBlock label="💬 Phát biểu" value={`${report.participationTotal} lượt`} />
          <StatBlock label="⭐ Điểm" value={formatPointsTotal(report.pointsTotal)} />
        </CardContent>
      </Card>

      <p className="mb-4 text-sm text-muted-foreground">
        Khoảng thời gian: {formatReportRangeLabel(report.range)}
      </p>

      <div className="grid gap-4 lg:grid-cols-3">
        <RankingList
          description="Học sinh có nhiều lượt phát biểu trong khoảng thời gian đã chọn."
          items={report.topParticipation}
          title="Nhiều lượt phát biểu"
          valueLabel={(value) => `${value}`}
        />
        <RankingList
          description="Học sinh có tổng điểm cao trong khoảng thời gian đã chọn."
          items={report.topPoints}
          title="Nhiều điểm"
          valueLabel={(value) => formatPointsTotal(value)}
        />
        <RankingList
          description="Theo dõi chuyên cần — số ngày vắng mặt trong khoảng thời gian đã chọn."
          items={report.mostAbsent}
          title="Vắng nhiều ngày"
          valueLabel={(value) => `${value} ngày`}
        />
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        Xem chi tiết từng học sinh trong{" "}
        <Link className="font-medium text-primary hover:underline" href={`/classes/${classId}/students`}>
          danh sách học sinh
        </Link>
        .
      </p>
    </>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
