"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Undo2 } from "lucide-react";
import { recordStudentPoints, undoStudentPoints } from "@/app/actions/points";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  formatPointsDelta,
  formatPointsTotal,
  needsNegativeConfirmation,
  pointEventEmoji,
  POINT_OPTIONS,
} from "@/lib/points/format";
import { getLocalDateString } from "@/lib/dates";
import { formatDateVi } from "@/lib/students/format";
import type { PointValue, StudentPointEvent, UndoablePointEvent } from "@/types/points";

type StudentPointsControlsProps = {
  classId: string;
  studentId: string;
  studentName: string;
  initialTotal: number;
  initialHistory?: StudentPointEvent[];
  variant?: "detail" | "compact";
};

function formatHistoryDate(isoDateTime: string): string {
  return formatDateVi(getLocalDateString(new Date(isoDateTime)));
}

export function StudentPointsControls({
  classId,
  studentId,
  studentName,
  initialTotal,
  initialHistory = [],
  variant = "detail",
}: StudentPointsControlsProps) {
  const router = useRouter();
  const [total, setTotal] = useState(initialTotal);
  const [history, setHistory] = useState(initialHistory);
  const [customReason, setCustomReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastUndo, setLastUndo] = useState<UndoablePointEvent | null>(null);
  const [isUndoing, setIsUndoing] = useState(false);

  async function handleAward(points: PointValue) {
    if (needsNegativeConfirmation(points)) {
      const confirmed = window.confirm(
        `Bạn có chắc muốn trừ ${Math.abs(points)} điểm cho ${studentName}?`,
      );
      if (!confirmed) return;
    }

    setError(null);
    const requestId = crypto.randomUUID();
    const reasonSnapshot = customReason;

    setTotal((current) => current + points);

    const result = await recordStudentPoints(
      classId,
      studentId,
      points,
      requestId,
      reasonSnapshot,
    );

    if (!result.ok) {
      setTotal((current) => current - points);
      setError(result.error);
      return;
    }

    const newEvent: StudentPointEvent = {
      id: result.eventId,
      points: result.points,
      reason: result.reason,
      created_at: new Date().toISOString(),
    };

    if (variant === "detail") {
      setHistory((current) => [newEvent, ...current].slice(0, 20));
    }

    setLastUndo({
      eventId: result.eventId,
      studentId,
      studentName,
      points: result.points,
      reason: result.reason,
    });
    setCustomReason("");
    router.refresh();
  }

  async function handleUndo() {
    if (!lastUndo || isUndoing) return;

    setIsUndoing(true);
    setError(null);
    const undoTarget = lastUndo;
    setLastUndo(null);

    setTotal((current) => current - undoTarget.points);
    if (variant === "detail") {
      setHistory((current) => current.filter((event) => event.id !== undoTarget.eventId));
    }

    const result = await undoStudentPoints(classId, undoTarget.eventId, studentId);

    if (!result.ok) {
      setTotal((current) => current + undoTarget.points);
      if (variant === "detail") {
        setHistory((current) => [
          {
            id: undoTarget.eventId,
            points: undoTarget.points,
            reason: undoTarget.reason,
            created_at: new Date().toISOString(),
          },
          ...current,
        ]);
      }
      setLastUndo(undoTarget);
      setError(result.error);
    }

    setIsUndoing(false);
    if (result.ok) router.refresh();
  }

  const positiveOptions = POINT_OPTIONS.filter((value) => value > 0);
  const negativeOptions = POINT_OPTIONS.filter((value) => value < 0);

  return (
    <div className={variant === "compact" ? "mt-3 border-t pt-3" : ""}>
      {variant === "detail" ? (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Điểm hiện tại</p>
            <p className="text-3xl font-bold">{formatPointsTotal(total)}</p>
          </div>
          {lastUndo ? (
            <Button
              className="h-11"
              disabled={isUndoing}
              onClick={handleUndo}
              type="button"
              variant="outline"
            >
              <Undo2 className="size-4" />
              {isUndoing ? "Đang hoàn tác…" : "Hoàn tác"}
            </Button>
          ) : null}
        </div>
      ) : (
        <p className="mb-2 text-sm font-medium text-muted-foreground">
          Điểm: <span className="text-foreground">{formatPointsTotal(total)}</span>
        </p>
      )}

      <div className="grid grid-cols-3 gap-2">
        {positiveOptions.map((points) => (
          <Button
            className="h-11 text-base"
            key={points}
            onClick={() => handleAward(points)}
            type="button"
            variant="outline"
          >
            +{points}
          </Button>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {negativeOptions.map((points) => (
          <Button
            className="h-11 text-base"
            key={points}
            onClick={() => handleAward(points)}
            type="button"
            variant="destructive"
          >
            {points}
          </Button>
        ))}
      </div>

      {variant === "detail" ? (
        <div className="mt-4 space-y-2">
          <label className="text-sm font-medium text-muted-foreground" htmlFor={`reason-${studentId}`}>
            Thêm lý do (tuỳ chọn)
          </label>
          <Input
            className="h-11"
            id={`reason-${studentId}`}
            onChange={(event) => setCustomReason(event.target.value)}
            placeholder="Ví dụ: Giúp bạn, Làm bài tốt…"
            value={customReason}
          />
        </div>
      ) : null}

      {error ? (
        <p aria-live="polite" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {variant === "detail" ? (
        <div className="mt-6">
          <p className="text-sm font-medium text-muted-foreground">Lịch sử điểm</p>
          {history.length ? (
            <ul className="mt-3 space-y-2">
              {history.map((event) => (
                <li
                  className="rounded-lg border px-3 py-2 text-sm"
                  key={event.id}
                >
                  <p className="font-medium">{formatHistoryDate(event.created_at)}</p>
                  <p className="mt-1">
                    {pointEventEmoji(event.points)} {event.reason}{" "}
                    <span className="font-semibold">{formatPointsDelta(event.points)}</span>
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Chưa có lịch sử điểm.</p>
          )}
        </div>
      ) : null}

      {variant === "compact" && lastUndo ? (
        <Button
          className="mt-2 h-9 w-full"
          disabled={isUndoing}
          onClick={handleUndo}
          size="sm"
          type="button"
          variant="ghost"
        >
          <Undo2 className="size-4" />
          Hoàn tác {formatPointsDelta(lastUndo.points)}
        </Button>
      ) : null}
    </div>
  );
}
