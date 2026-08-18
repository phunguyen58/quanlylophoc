"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteSchoolYear } from "@/app/actions/school-years";
import { Button } from "@/components/ui/button";

type DeleteSchoolYearButtonProps = {
  classCount: number;
  schoolYearId: string;
  schoolYearName: string;
};

export function DeleteSchoolYearButton({
  classCount,
  schoolYearId,
  schoolYearName,
}: DeleteSchoolYearButtonProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const canDelete = classCount === 0;

  function openConfirm() {
    setError(null);
    setIsConfirming(true);
  }

  function confirmDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteSchoolYear(schoolYearId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setIsConfirming(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button
        aria-label={`Xóa năm học ${schoolYearName}`}
        disabled={!canDelete}
        onClick={openConfirm}
        title={canDelete ? "Xóa năm học" : "Cần xóa hết lớp trong năm học trước"}
        type="button"
        size="icon-xs"
        variant="destructive"
      >
        <Trash2 className="size-3.5" />
      </Button>

      {isConfirming ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md space-y-3 rounded-xl border bg-card p-4 shadow-xl">
            <h2 className="text-lg font-bold">Xóa năm học {schoolYearName}?</h2>
            <p className="text-sm text-muted-foreground">
              Chỉ xóa được năm học khi không còn lớp nào trong năm học đó. Thao tác này sẽ ẩn năm
              học khỏi danh sách.
            </p>
            {error ? (
              <p aria-live="polite" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button onClick={() => setIsConfirming(false)} type="button" variant="outline">
                Huỷ
              </Button>
              <Button
                disabled={isPending}
                onClick={confirmDelete}
                type="button"
                variant="destructive"
              >
                {isPending ? "Đang xóa…" : "Xóa năm học"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
