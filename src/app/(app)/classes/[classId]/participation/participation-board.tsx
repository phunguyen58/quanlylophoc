"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, Search } from "lucide-react";
import { recordParticipation } from "@/app/actions/participation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ParticipationCounts } from "@/types/participation";

type ParticipationBoardProps = {
  classId: string;
  students: { id: string; full_name: string; student_code: string }[];
  initialCounts: ParticipationCounts;
};

export function ParticipationBoard({
  classId,
  students,
  initialCounts,
}: ParticipationBoardProps) {
  const [counts, setCounts] = useState<ParticipationCounts>(initialCounts);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return students;

    return students.filter(
      (student) =>
        student.full_name.toLowerCase().includes(query) ||
        student.student_code.toLowerCase().includes(query),
    );
  }, [search, students]);

  async function adjustCount(
    student: ParticipationBoardProps["students"][number],
    delta: 1 | -1,
  ) {
    const currentCount = counts[student.id] ?? 0;
    if (delta === -1 && currentCount <= 0) return;
    if (pendingIds.has(student.id)) return;

    setError(null);
    setPendingIds((current) => new Set(current).add(student.id));

    setCounts((current) => ({
      ...current,
      [student.id]: Math.max(0, (current[student.id] ?? 0) + delta),
    }));

    const result = await recordParticipation(classId, student.id, crypto.randomUUID(), delta);

    if (!result.ok) {
      setCounts((current) => ({
        ...current,
        [student.id]: Math.max(0, (current[student.id] ?? 0) - delta),
      }));
      setError(result.error);
    }

    setPendingIds((current) => {
      const next = new Set(current);
      next.delete(student.id);
      return next;
    });
  }

  return (
    <>
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Tìm học sinh"
          className="h-9 pl-9"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm theo tên hoặc mã học sinh…"
          value={search}
        />
      </div>

      {error ? (
        <p aria-live="polite" className="mb-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {students.length === 0 ? (
        <Card>
          <CardContent className="py-4 text-center text-muted-foreground">
            Lớp chưa có học sinh. Thêm học sinh trước khi ghi nhận phát biểu.
          </CardContent>
        </Card>
      ) : filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="py-4 text-center text-muted-foreground">
            Không tìm thấy học sinh phù hợp với từ khóa &quot;{search.trim()}&quot;.
          </CardContent>
        </Card>
      ) : (
        <div className="divide-y rounded-lg border bg-card">
          {filteredStudents.map((student) => {
            const count = counts[student.id] ?? 0;
            const isPending = pendingIds.has(student.id);

            return (
              <div className="px-3 py-2" key={student.id}>
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{student.full_name}</p>
                    <p className="text-xs text-muted-foreground">{student.student_code}</p>
                  </div>

                  <div
                    aria-label={`Số lần phát biểu của ${student.full_name}`}
                    className="flex shrink-0 items-center gap-1.5"
                    role="group"
                  >
                    <button
                      aria-label={`Giảm phát biểu của ${student.full_name}`}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-border/60 bg-muted/30 text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={count <= 0 || isPending}
                      onClick={() => adjustCount(student, -1)}
                      type="button"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span
                      aria-live="polite"
                      className="min-w-[1.75rem] text-center text-sm font-bold tabular-nums"
                    >
                      {count}
                    </span>
                    <button
                      aria-label={`Tăng phát biểu của ${student.full_name}`}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary transition-colors hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={isPending}
                      onClick={() => adjustCount(student, 1)}
                      type="button"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        Bấm <span className="font-medium">+</span> để ghi nhận phát biểu, <span className="font-medium">−</span> để
        hoàn tác nhanh.
      </p>
    </>
  );
}
