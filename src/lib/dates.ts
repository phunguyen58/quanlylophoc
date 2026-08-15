const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const CLASSROOM_TIME_ZONE = "Asia/Ho_Chi_Minh";
const VIETNAM_UTC_OFFSET_MS = 7 * 60 * 60 * 1000;

function formatDatePartsInClassroomTimeZone(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CLASSROOM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return { day: Number(values.day), month: Number(values.month), year: Number(values.year) };
}

function utcDateFromCalendarDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function isIsoDateString(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/** Vietnam classroom calendar date as YYYY-MM-DD, independent of server/browser timezone. */
export function getLocalDateString(date = new Date()): string {
  const { year, month, day } = formatDatePartsInClassroomTimeZone(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseIsoDateString(dateStr: string): Date {
  return utcDateFromCalendarDate(dateStr);
}

export function addDaysToDateString(dateStr: string, days: number): string {
  const date = parseIsoDateString(dateStr);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function isFutureDateString(dateStr: string, today = getLocalDateString()): boolean {
  return dateStr > today;
}

export function getWeekRangeLocal(dateStr: string): { start: string; end: string } {
  const date = parseIsoDateString(dateStr);
  const weekday = date.getUTCDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return { start: monday.toISOString().slice(0, 10), end: sunday.toISOString().slice(0, 10) };
}

export function getMonthRangeLocal(dateStr: string): { start: string; end: string } {
  const [year, month] = dateStr.split("-").map(Number);
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

export function formatShortDateVi(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

export function formatDateLabelVi(dateStr: string, today = getLocalDateString()): string {
  if (dateStr === today) return "Hôm nay";
  const yesterday = addDaysToDateString(today, -1);
  if (dateStr === yesterday) return "Hôm qua";
  return formatShortDateVi(dateStr);
}

export function formatDateNavButtonLabel(dateStr: string, today = getLocalDateString()): string {
  const shortDate = formatShortDateVi(dateStr);
  if (dateStr === today) return `Hôm nay - ${shortDate}`;
  const yesterday = addDaysToDateString(today, -1);
  if (dateStr === yesterday) return `Hôm qua - ${shortDate}`;
  return shortDate;
}

/** Vietnam calendar day bounds as UTC ISO strings for timestamptz queries. */
export function getLocalDayBoundsIso(dateStr: string): { start: string; end: string } {
  const [year, month, day] = dateStr.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day) - VIETNAM_UTC_OFFSET_MS);
  const end = new Date(Date.UTC(year, month - 1, day + 1) - VIETNAM_UTC_OFFSET_MS - 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function isSameLocalDate(isoDateTime: string, dateStr: string): boolean {
  const date = new Date(isoDateTime);
  return getLocalDateString(date) === dateStr;
}
