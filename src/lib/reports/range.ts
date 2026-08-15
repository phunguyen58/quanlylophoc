import {
  getLocalDayBoundsIso,
  getLocalDateString,
  getMonthRangeLocal,
  getWeekRangeLocal,
  isFutureDateString,
  isIsoDateString,
} from "@/lib/dates";
import type { DateRange, ReportFilter } from "@/types/reports";

export function getLocalRangeBoundsIso(startDate: string, endDate: string): {
  start: string;
  end: string;
} {
  const start = getLocalDayBoundsIso(startDate).start;
  const end = getLocalDayBoundsIso(endDate).end;
  return { start, end };
}

export function resolveReportRange(
  filter: ReportFilter,
  options: {
    today?: string;
    from?: string;
    to?: string;
  } = {},
): DateRange | null {
  const today = options.today ?? getLocalDateString();

  if (filter === "today") {
    return { start: today, end: today };
  }

  if (filter === "week") {
    return getWeekRangeLocal(today);
  }

  if (filter === "month") {
    return getMonthRangeLocal(today);
  }

  const from = options.from?.trim();
  const to = options.to?.trim();
  if (!from || !to || !isIsoDateString(from) || !isIsoDateString(to)) {
    return null;
  }

  if (from > to) return null;
  if (isFutureDateString(from, today) || isFutureDateString(to, today)) return null;

  return { start: from, end: to };
}

export function parseReportFilter(value: string | undefined): ReportFilter {
  if (value === "week" || value === "month" || value === "custom") return value;
  return "today";
}

export function formatReportRangeLabel(range: DateRange, today = getLocalDateString()): string {
  if (range.start === range.end) {
    return range.start === today ? "Hôm nay" : `${range.start}`;
  }
  return `${range.start} → ${range.end}`;
}
