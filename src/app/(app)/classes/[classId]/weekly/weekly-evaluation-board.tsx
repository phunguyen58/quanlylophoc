"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveWeeklyEvaluations } from "@/app/actions/evaluations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Student = { id: string; full_name: string; student_code: string };
type Evaluation = { student_id: string; level: string; comment: string };
const SUGGESTIONS = ["Rất tốt", "Tốt", "Khá", "Trung bình", "Cần cố gắng"];

export function WeeklyEvaluationBoard({ classId, students, saved, initialWeek }: { classId: string; students: Student[]; saved: Evaluation[]; initialWeek: number }) {
  const router = useRouter();
  const [week, setWeek] = useState(initialWeek);
  const [entries, setEntries] = useState(() => {
    const map = new Map(saved.map((item) => [item.student_id, item]));
    return students.map((student) => ({ student_id: student.id, full_name: student.full_name, student_code: student.student_code, level: map.get(student.id)?.level ?? "", comment: map.get(student.id)?.comment ?? "" }));
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startTransition] = useTransition();
  const weeks = useMemo(() => Array.from({ length: 35 }, (_, index) => index + 1), []);

  function patch(studentId: string, field: "level" | "comment", value: string) {
    setEntries((current) => current.map((entry) => entry.student_id === studentId ? { ...entry, [field]: value } : entry));
  }

  function goToWeek(nextWeek: number) {
    setWeek(nextWeek);
    router.push(`/classes/${classId}/weekly?week=${nextWeek}`);
  }

  function handleSave() {
    startTransition(async () => {
      setMessage(null); setError(null);
      const result = await saveWeeklyEvaluations(classId, week, entries.map(({ student_id, level, comment }) => ({ student_id, level, comment })));
      if (result.error) { setError(result.error); return; }
      setMessage(result.success ?? "Đã lưu đánh giá.");
      router.refresh();
    });
  }

  return <>
    <div className="mb-3 rounded-xl border bg-card p-3">
      <p className="mb-2 text-sm font-semibold">Chọn tuần học</p>
      <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-7 lg:grid-cols-10">
        {weeks.map((item) => <button className={`h-8 rounded-lg border text-xs font-semibold ${item === week ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`} key={item} onClick={() => goToWeek(item)} type="button">Tuần {item}</button>)}
      </div>
    </div>
    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="text-lg font-bold">Đánh giá tuần {week}</h2><p className="text-xs text-muted-foreground">Chọn nhanh mức đánh giá hoặc tự nhập nhận xét riêng.</p></div>
      <Button disabled={isSaving} onClick={handleSave}>{isSaving ? "Đang lưu…" : "Lưu đánh giá"}</Button>
    </div>
    {message && <p className="mb-2 text-sm text-emerald-600">{message}</p>}{error && <p className="mb-2 text-sm text-destructive">{error}</p>}
    {students.length === 0 ? <Card><CardContent className="py-4 text-center text-muted-foreground">Lớp chưa có học sinh để đánh giá.</CardContent></Card> : <div className="divide-y rounded-xl border bg-card">
      {entries.map((entry, index) => <div className="space-y-2 p-3" key={entry.student_id}>
        <div><p className="font-semibold">{index + 1}. {entry.full_name}</p><p className="text-xs text-muted-foreground">{entry.student_code}</p></div>
        <div className="flex flex-wrap gap-1.5">{SUGGESTIONS.map((level) => <button className={`rounded-full border px-3 py-1 text-xs font-semibold ${entry.level === level ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`} key={level} onClick={() => patch(entry.student_id, "level", level)} type="button">{level}</button>)}</div>
        <div className="grid gap-2 sm:grid-cols-[180px_1fr]"><Input aria-label="Mức đánh giá" onChange={(e) => patch(entry.student_id, "level", e.target.value)} placeholder="Mức đánh giá" value={entry.level} /><Input aria-label="Nhận xét" onChange={(e) => patch(entry.student_id, "comment", e.target.value)} placeholder="Nhận xét ngắn cho phụ huynh / giáo viên" value={entry.comment} /></div>
      </div>)}
    </div>}
  </>;
}
