"use client";
import { useActionState, useState } from "react";
import { createClass, type CreateClassState } from "@/app/actions/classes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
const initialState: CreateClassState = {};
export function CreateClassForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createClass, initialState);

  return (
    <div className="mt-6">
      {!isOpen ? (
        <Button className="h-12 text-base" onClick={() => setIsOpen(true)}>
          + Tạo lớp
        </Button>
      ) : (
        <form action={formAction} className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Tạo lớp mới</h2>
            <Button onClick={() => setIsOpen(false)} type="button" variant="ghost">
              Đóng
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="class-name">Tên lớp</Label>
              <Input id="class-name" name="name" placeholder="Ví dụ: 4A1" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="school-year">Năm học</Label>
              <Input
                id="school-year"
                name="schoolYear"
                pattern="[0-9]{4}-[0-9]{4}"
                placeholder="Ví dụ: 2026-2027"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade">Khối</Label>
              <Input id="grade" max="12" min="1" name="grade" required type="number" />
            </div>
          </div>
          {state.error && (
            <p aria-live="polite" className="mt-3 text-sm text-destructive">
              {state.error}
            </p>
          )}
          <div className="mt-5 flex gap-3">
            <Button disabled={pending} type="submit">
              {pending ? "Đang tạo…" : "Lưu lớp"}
            </Button>
            <Button onClick={() => setIsOpen(false)} type="button" variant="outline">
              Huỷ
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
