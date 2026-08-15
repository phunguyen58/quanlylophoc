"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSchoolYear } from "@/app/actions/school-years";
import { SchoolYearPicker } from "@/components/school-years/school-year-picker";
import { Button } from "@/components/ui/button";
import { defaultNewSchoolYearName, nearbySchoolYearOptions } from "@/lib/school-years";

export function CreateSchoolYearForm({ existingYears = [] }: { existingYears?: string[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const options = useMemo(() => nearbySchoolYearOptions(), []);
  const defaultYear = defaultNewSchoolYearName();
  const taken = useMemo(() => new Set(existingYears), [existingYears]);
  const [selected, setSelected] = useState(defaultYear);

  const firstAvailable = useMemo(
    () => options.find((year) => !taken.has(year)) ?? "",
    [options, taken],
  );

  const effectiveValue =
    selected && !taken.has(selected) ? selected : firstAvailable;

  function openForm() {
    setError(null);
    setSelected(taken.has(defaultYear) ? firstAvailable : defaultYear);
    setIsOpen(true);
  }

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createSchoolYear({}, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setIsOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="mt-6">
      {!isOpen ? (
        <Button className="h-11" onClick={openForm} type="button" variant="outline">
          + Thêm năm học
        </Button>
      ) : (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <form
            action={submit}
            className="w-full max-w-md space-y-4 rounded-2xl border bg-card p-5 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Thêm năm học</h2>
              <Button onClick={() => setIsOpen(false)} type="button" variant="ghost">
                Đóng
              </Button>
            </div>

            <SchoolYearPicker
              disabledOptions={existingYears}
              label="Chọn năm học"
              name="name"
              onChange={setSelected}
              options={options}
              value={effectiveValue}
            />
            <p className="text-xs font-bold text-black">
              Danh sách từ 2026-2027 đến 2040-2041. Năm đã có sẽ hiện “(đã có)”.
            </p>

            {error ? (
              <p aria-live="polite" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <div className="flex justify-end gap-2">
              <Button onClick={() => setIsOpen(false)} type="button" variant="outline">
                Huỷ
              </Button>
              <Button disabled={pending || !effectiveValue} type="submit">
                {pending ? "Đang lưu…" : "Lưu năm học"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
