"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadClassEvaluationReportExcel } from "@/lib/reports/export-excel";
import type { ClassReportData } from "@/types/reports";

export function ExportReportButton({ report }: { report: ClassReportData }) {
  return (
    <Button onClick={() => downloadClassEvaluationReportExcel(report)} type="button">
      <Download className="size-4" />
      Xuất Excel
    </Button>
  );
}
