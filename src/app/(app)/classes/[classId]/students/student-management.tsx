"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Eye, FileSpreadsheet, Pencil, Search, Trash2, UserPlus } from "lucide-react";
import { softDeleteStudent } from "@/app/actions/students";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDateVi, genderLabel } from "@/lib/students/format";
import { formatPointsTotal } from "@/lib/points/format";
import type { StudentListItem } from "@/types/student";
import type { StudentPointTotals } from "@/types/points";
import { StudentFormPanel } from "./student-form-panel";
import { StudentImportPanel } from "./student-import-panel";
import { StudentPointsControls } from "./student-points-controls";

type StudentManagementProps = {
  classId: string;
  className: string;
  initialEditId?: string;
  pointTotals: StudentPointTotals;
  students: StudentListItem[];
};

type PanelMode = "none" | "create" | "edit" | "import";

export function StudentManagement({
  classId,
  className,
  initialEditId,
  pointTotals,
  students,
}: StudentManagementProps) {
  const router = useRouter();
  const initialEditStudent = initialEditId
    ? students.find((student) => student.id === initialEditId) ?? null
    : null;

  const [search, setSearch] = useState("");
  const [panel, setPanel] = useState<PanelMode>(initialEditStudent ? "edit" : "none");
  const [editingStudent, setEditingStudent] = useState<
    (StudentListItem & { updated_at?: string }) | null
  >(initialEditStudent);
  const [deleteTarget, setDeleteTarget] = useState<StudentListItem | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return students;

    return students.filter(
      (student) =>
        student.full_name.toLowerCase().includes(query) ||
        student.student_code.toLowerCase().includes(query),
    );
  }, [search, students]);

  function openCreate() {
    setPanel("create");
    setEditingStudent(null);
    setError(null);
  }

  function openEdit(student: StudentListItem & { updated_at?: string }) {
    setPanel("edit");
    setEditingStudent(student);
    setError(null);
  }

  function openImport() {
    setPanel("import");
    setEditingStudent(null);
    setError(null);
  }

  function closePanel() {
    setPanel("none");
    setEditingStudent(null);
  }

  function handleDelete() {
    if (!deleteTarget) return;

    startDeleteTransition(async () => {
      const result = await softDeleteStudent(classId, deleteTarget.id);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
        setFeedback(result.success ?? "Đã đưa học sinh ra khỏi danh sách lớp.");
        setError(null);
      }
      setDeleteTarget(null);
    });
  }

  return (
    <>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Tìm học sinh"
            className="h-9 pl-9"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tên hoặc mã học sinh…"
            value={search}
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:flex-row">
          <Button className="h-9" onClick={openCreate} type="button">
            <UserPlus className="size-4" />
            Thêm học sinh
          </Button>
          <Button className="h-9" onClick={openImport} type="button" variant="outline">
            <FileSpreadsheet className="size-4" />
            Import Excel
          </Button>
        </div>
      </div>

      {feedback && (
        <p aria-live="polite" className="mb-2 text-sm text-emerald-600">
          {feedback}
        </p>
      )}
      {error && (
        <p aria-live="polite" className="mb-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {panel === "create" && (
        <div className="mb-3">
          <StudentFormPanel
            classId={classId}
            mode="create"
            onClose={closePanel}
            onSuccess={() => setFeedback("Đã thêm học sinh.")}
          />
        </div>
      )}

      {panel === "edit" && editingStudent && (
        <div className="mb-3">
          <StudentFormPanel
            classId={classId}
            mode="edit"
            onClose={closePanel}
            onSuccess={() => setFeedback("Đã lưu thông tin học sinh.")}
            student={editingStudent}
          />
        </div>
      )}

      {panel === "import" && (
        <div className="mb-3">
          <StudentImportPanel
            classId={classId}
            onClose={closePanel}
            onSuccess={setFeedback}
          />
        </div>
      )}

      {students.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center p-8 text-center">
            <p className="text-lg font-bold">Lớp này chưa có học sinh.</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Thêm từng học sinh hoặc import danh sách từ Excel cho lớp {className}.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button className="h-11" onClick={openCreate} type="button">
                <UserPlus className="size-4" />
                Thêm học sinh
              </Button>
              <Button className="h-11" onClick={openImport} type="button" variant="outline">
                <FileSpreadsheet className="size-4" />
                Import Excel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Không tìm thấy học sinh phù hợp với từ khóa &quot;{search.trim()}&quot;.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border md:block">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-3 py-2 text-xs font-semibold">Họ tên</th>
                  <th className="px-3 py-2 text-xs font-semibold">Mã HS</th>
                  <th className="px-3 py-2 text-xs font-semibold">Ngày sinh</th>
                  <th className="px-3 py-2 text-xs font-semibold">Giới tính</th>
                  <th className="px-3 py-2 text-xs font-semibold">Điểm</th>
                  <th className="px-3 py-2 text-xs font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr className="border-t" key={student.id}>
                    <td className="px-3 py-2 font-medium">{student.full_name}</td>
                    <td className="px-3 py-2">{student.student_code}</td>
                    <td className="px-3 py-2">{formatDateVi(student.date_of_birth)}</td>
                    <td className="px-3 py-2">{genderLabel(student.gender)}</td>
                    <td className="px-3 py-2 font-medium">
                      {formatPointsTotal(pointTotals[student.id] ?? 0)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        <Button
                          nativeButton={false}
                          render={<Link href={`/classes/${classId}/students/${student.id}`} />}
                          size="sm"
                          variant="ghost"
                        >
                          <Eye className="size-4" />
                          Xem
                        </Button>
                        <Button
                          onClick={() => openEdit(student)}
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          <Pencil className="size-4" />
                          Sửa
                        </Button>
                        <Button
                          onClick={() => setDeleteTarget(student)}
                          size="sm"
                          type="button"
                          variant="destructive"
                        >
                          <Trash2 className="size-4" />
                          Xóa
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y rounded-lg border bg-card md:hidden">
            {filteredStudents.map((student) => (
              <div className="px-3 py-2" key={student.id}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{student.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {student.student_code} · {formatDateVi(student.date_of_birth)} · {genderLabel(student.gender)}
                    </p>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  <Button
                    className="h-8"
                    nativeButton={false}
                    render={<Link href={`/classes/${classId}/students/${student.id}`} />}
                    size="sm"
                    variant="outline"
                  >
                    <Eye className="size-3.5" />
                    Xem
                  </Button>
                  <Button
                    className="h-8"
                    onClick={() => openEdit(student)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <Pencil className="size-3.5" />
                    Sửa
                  </Button>
                  <Button
                    className="h-8"
                    onClick={() => setDeleteTarget(student)}
                    size="sm"
                    type="button"
                    variant="destructive"
                  >
                    <Trash2 className="size-3.5" />
                    Xóa
                  </Button>
                </div>
                <StudentPointsControls
                  classId={classId}
                  initialTotal={pointTotals[student.id] ?? 0}
                  studentId={student.id}
                  studentName={student.full_name}
                  variant="compact"
                />
              </div>
            ))}
          </div>
        </>
      )}

      {deleteTarget && (
        <dialog
          className="fixed inset-0 z-50 m-0 flex h-full max-h-none w-full max-w-none items-center justify-center bg-black/40 p-4 backdrop:bg-black/40"
          open
        >
          <div className="w-full max-w-md rounded-2xl bg-card p-5 shadow-lg">
            <h3 className="text-lg font-bold">Xác nhận xóa học sinh</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Bạn có chắc muốn đưa học sinh này ra khỏi danh sách lớp?
            </p>
            <p className="mt-2 font-medium">{deleteTarget.full_name}</p>
            <div className="mt-5 flex gap-3">
              <Button
                className="h-11"
                disabled={isDeleting}
                onClick={handleDelete}
                type="button"
                variant="destructive"
              >
                {isDeleting ? "Đang xóa…" : "Xóa khỏi lớp"}
              </Button>
              <Button
                className="h-11"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                type="button"
                variant="outline"
              >
                Huỷ
              </Button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}
