"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveScores } from "@/app/actions/scores";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Student = { id: string; full_name: string; student_code: string };
type Score = { student_id: string; theory_score: number | null; practice_score: number | null; total_score: number | null };

function fmt(value: number | null | undefined) { return value == null ? "" : String(value); }
function total(theory: string | number, practice: string | number) { const a = Number(theory); const b = Number(practice); return Number.isFinite(a) && Number.isFinite(b) ? ((a + b) / 2).toFixed(2).replace(/\.00$/, "") : "—"; }

export function ScoreBoard({ classId, students, semesterScores, annualScores }: { classId: string; students: Student[]; semesterScores: Score[]; annualScores: Score[] }) {
  const router = useRouter();
  const [type, setType] = useState<"semester" | "annual">("semester");
  const [entries, setEntries] = useState(() => {
    const semesterMap = new Map(semesterScores.map((s) => [s.student_id, s]));
    const annualMap = new Map(annualScores.map((s) => [s.student_id, s]));
    return students.map((student) => ({ student_id: student.id, full_name: student.full_name, student_code: student.student_code, semesterTheory: fmt(semesterMap.get(student.id)?.theory_score), semesterPractice: fmt(semesterMap.get(student.id)?.practice_score), annualTheory: fmt(annualMap.get(student.id)?.theory_score), annualPractice: fmt(annualMap.get(student.id)?.practice_score) }));
  });
  const [message, setMessage] = useState<string | null>(null); const [error, setError] = useState<string | null>(null); const [isSaving, startTransition] = useTransition();
  function patch(id: string, field: "semesterTheory" | "semesterPractice" | "annualTheory" | "annualPractice", value: string) { setEntries((current) => current.map((e) => e.student_id === id ? { ...e, [field]: value } : e)); }
  function handleSave() { startTransition(async () => { setMessage(null); setError(null); const result = await saveScores(classId, type, entries.map((e) => ({ student_id: e.student_id, theory_score: type === "semester" ? e.semesterTheory : e.annualTheory, practice_score: type === "semester" ? e.semesterPractice : e.annualPractice }))); if (result.error) { setError(result.error); return; } setMessage(result.success ?? "Đã lưu điểm."); router.refresh(); }); }
  return <>
    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-2"><Button onClick={() => setType("semester")} variant={type === "semester" ? "default" : "outline"}>Học kỳ 1</Button><Button onClick={() => setType("annual")} variant={type === "annual" ? "default" : "outline"}>Cuối năm</Button></div><Button disabled={isSaving} onClick={handleSave}>{isSaving ? "Đang lưu…" : "Lưu điểm"}</Button></div>
    <p className="mb-3 text-sm text-muted-foreground">Tổng tự tính theo công thức mặc định: (Lý thuyết + Thực hành) / 2.</p>
    {message && <p className="mb-2 text-sm text-emerald-600">{message}</p>}{error && <p className="mb-2 text-sm text-destructive">{error}</p>}
    {students.length === 0 ? <Card><CardContent className="py-4 text-center text-muted-foreground">Lớp chưa có học sinh để nhập điểm.</CardContent></Card> : <div className="divide-y rounded-xl border bg-card">{entries.map((entry, index) => {
      const theoryField = type === "semester" ? "semesterTheory" : "annualTheory"; const practiceField = type === "semester" ? "semesterPractice" : "annualPractice";
      return <div className="grid gap-2 p-3 lg:grid-cols-[1fr_140px_140px_100px] lg:items-center" key={entry.student_id}><div><p className="font-semibold">{index + 1}. {entry.full_name}</p><p className="text-xs text-muted-foreground">{entry.student_code}</p></div><Input inputMode="decimal" max="10" min="0" onChange={(e) => patch(entry.student_id, theoryField, e.target.value)} placeholder="Lý thuyết" type="number" value={entry[theoryField]} /><Input inputMode="decimal" max="10" min="0" onChange={(e) => patch(entry.student_id, practiceField, e.target.value)} placeholder="Thực hành" type="number" value={entry[practiceField]} /><div className="rounded-lg bg-muted px-3 py-2 text-sm font-bold">Tổng: {total(entry[theoryField], entry[practiceField])}</div></div>})}</div>}
  </>;
}
