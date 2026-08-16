"use client";

import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";

type ReportYearSelectProps = {
  selectedYearId: string;
  years: Array<{
    id: string;
    name: string;
  }>;
};

export function ReportYearSelect({ selectedYearId, years }: ReportYearSelectProps) {
  const router = useRouter();

  return (
    <div className="mb-4 max-w-xs space-y-2">
      <Label htmlFor="report-school-year">Chọn năm học</Label>
      <select
        className="h-11 w-full rounded-xl border border-input bg-card px-3 text-base font-semibold text-foreground shadow-sm transition focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/20 md:text-sm"
        id="report-school-year"
        onChange={(event) => {
          router.push(`/reports?year=${encodeURIComponent(event.target.value)}`);
        }}
        value={selectedYearId}
      >
        {years.map((year) => (
          <option key={year.id} value={year.id}>
            {year.name}
          </option>
        ))}
      </select>
    </div>
  );
}
