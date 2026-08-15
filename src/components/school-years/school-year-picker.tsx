"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nearbySchoolYearOptions, defaultNewSchoolYearName } from "@/lib/school-years";
import { cn } from "@/lib/utils";

type SchoolYearPickerProps = {
  id?: string;
  name?: string;
  label?: string;
  /** Controlled selected value YYYY-YYYY */
  value: string;
  onChange: (value: string) => void;
  /** Full list; defaults to 2026-2027 … 2040-2041. */
  options?: string[];
  /** Years already created — still shown, but không chọn được. */
  disabledOptions?: string[];
  required?: boolean;
};

export function SchoolYearPicker({
  id = "school-year-picker",
  name = "name",
  label = "Năm học",
  value,
  onChange,
  options,
  disabledOptions = [],
  required = true,
}: SchoolYearPickerProps) {
  const allOptions = useMemo(() => options ?? nearbySchoolYearOptions(), [options]);
  const disabledSet = useMemo(() => new Set(disabledOptions), [disabledOptions]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allOptions;
    return allOptions.filter((year) => year.toLowerCase().includes(q));
  }, [allOptions, query]);

  const defaultHighlight = defaultNewSchoolYearName();

  return (
    <div className="relative space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <input name={name} required={required} type="hidden" value={value} />
      <button
        className="flex h-10 w-full items-center justify-between rounded-lg border bg-background px-3 text-left text-sm font-bold text-black"
        id={id}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span>{value || "Chọn năm học"}</span>
        <span>▼</span>
      </button>

      {open ? (
        <div className="absolute z-30 mt-1 max-h-72 w-full overflow-hidden rounded-lg border bg-card shadow-lg">
          <div className="border-b p-2">
            <Input
              autoFocus
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm năm học… (ví dụ 2026)"
              value={query}
            />
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.map((year) => {
              const isDisabled = disabledSet.has(year);
              return (
                <li key={year}>
                  <button
                    className={cn(
                      "block w-full px-3 py-2 text-left text-sm font-bold",
                      isDisabled
                        ? "cursor-not-allowed text-black/40"
                        : "hover:bg-sky-50",
                      year === value && !isDisabled && "bg-sky-50 text-primary",
                      year === defaultHighlight && year !== value && !isDisabled && "bg-sky-50/50",
                    )}
                    disabled={isDisabled}
                    onClick={() => {
                      if (isDisabled) return;
                      onChange(year);
                      setOpen(false);
                      setQuery("");
                    }}
                    type="button"
                  >
                    {year}
                    {isDisabled ? " (đã có)" : ""}
                    {year === defaultHighlight && !isDisabled ? " · mặc định" : ""}
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm font-bold text-black">Không tìm thấy năm học.</li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
