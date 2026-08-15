"use client";

import { useActionState, useState } from "react";
import { createClass, type CreateClassState } from "@/app/actions/classes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: CreateClassState = {};

type CreateClassFormProps = {
  /** When set, year is locked (create from under a specific school year). */
  lockedSchoolYear?: string;
  /** Compact trigger under each year section. */
  compact?: boolean;
  /** Controlled open from parent (optional). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function CreateClassForm({
  lockedSchoolYear,
  compact = false,
  open: controlledOpen,
  onOpenChange,
}: CreateClassFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen ?? internalOpen;
  const setIsOpen = (next: boolean) => {
    onOpenChange?.(next);
    if (controlledOpen === undefined) setInternalOpen(next);
  };

  const [state, formAction, pending] = useActionState(createClass, initialState);

  if (!isOpen) {
    return (
      <Button
        className={compact ? "h-8 gap-1 px-2.5 text-xs font-semibold" : "h-11"}
        onClick={() => setIsOpen(true)}
        size={compact ? "sm" : "default"}
        type="button"
        variant={compact ? "outline" : "default"}
      >
        + Tạo lớp
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <form action={formAction} className="w-full max-w-md space-y-4 rounded-2xl border bg-card p-5 shadow-xl">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold">Tạo lớp</h2>
          <Button onClick={() => setIsOpen(false)} type="button" variant="ghost">
            Đóng
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="school-year-locked">Năm học</Label>
          <Input
            className="bg-muted"
            id="school-year-locked"
            name="schoolYear"
            readOnly
            required
            value={lockedSchoolYear ?? ""}
          />
          {!lockedSchoolYear ? (
            <p className="text-xs text-destructive">Thiếu năm học. Đóng và tạo lại từ đúng năm học.</p>
          ) : (
            <p className="text-xs text-muted-foreground">Đã chọn theo năm học bạn đang đứng.</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="class-name">Tên lớp</Label>
          <Input id="class-name" name="name" placeholder="Ví dụ: 1.1" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="grade">Khối</Label>
          <Input id="grade" max={12} min={1} name="grade" placeholder="1–12" required type="number" />
        </div>

        {state.error ? (
          <p aria-live="polite" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button onClick={() => setIsOpen(false)} type="button" variant="outline">
            Huỷ
          </Button>
          <Button disabled={pending || !lockedSchoolYear} type="submit">
            {pending ? "Đang tạo…" : "Tạo lớp"}
          </Button>
        </div>
      </form>
    </div>
  );
}
