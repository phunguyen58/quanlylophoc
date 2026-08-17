"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { QuizQuestion, QuizSubmission } from "@/types/student-quiz";
import { updateQuizQuestion, deleteQuizQuestion, toggleQuizQuestionActive } from "@/app/actions/student-quiz";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus, Edit2, Trash2, Search, CheckCircle2, AlertCircle,
  BookOpen, Trophy, Sparkles, GraduationCap, ChevronLeft,
  Download, Eye, EyeOff, FileSpreadsheet
} from "lucide-react";
import Link from "next/link";
import * as XLSX from "xlsx";

interface Props {
  initialQuestions: QuizQuestion[];
  initialSubmissions: QuizSubmission[];
}

export function QuizManagementClient({ initialQuestions, initialSubmissions }: Props) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"questions" | "submissions">(
    tabParam === "submissions" ? "submissions" : "questions"
  );
  const [questions, setQuestions] = useState<QuizQuestion[]>(initialQuestions);
  const [submissions] = useState<QuizSubmission[]>(initialSubmissions);
  const [searchQuery, setSearchQuery] = useState("");

  // Lọc theo Khối
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<number | "all">("all");

  // Trạng thái Form soạn thảo câu hỏi
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Dữ liệu form câu hỏi
  const [formQuestion, setFormQuestion] = useState("");
  const [formOptions, setFormOptions] = useState(["", "", "", ""]);
  const [formCorrectAnswer, setFormCorrectAnswer] = useState(0);
  const [formExplanation, setFormExplanation] = useState("");
  const [formOrderIndex, setFormOrderIndex] = useState(0);
  const [formGrade, setFormGrade] = useState<number>(4);
  const [formIsActive, setFormIsActive] = useState(true);

  // Mở form thêm mới câu hỏi
  function handleOpenAdd() {
    setError(null);
    setSuccess(null);
    setFormQuestion("");
    setFormOptions(["", "", "", ""]);
    setFormCorrectAnswer(0);
    setFormExplanation("");
    setFormOrderIndex(questions.length + 1);
    setFormGrade(typeof selectedGradeFilter === "number" ? selectedGradeFilter : 4);
    setFormIsActive(true);
    setIsAdding(true);
    setEditingQuestion(null);
  }

  // Mở form chỉnh sửa câu hỏi
  function handleOpenEdit(q: QuizQuestion) {
    setError(null);
    setSuccess(null);
    setFormQuestion(q.question);
    setFormOptions([...q.options]);
    setFormCorrectAnswer(q.correctAnswer);
    setFormExplanation(q.explanation);
    setFormOrderIndex(q.order_index ?? 0);
    setFormGrade(q.grade ?? 4);
    setFormIsActive(q.is_active ?? true);
    setEditingQuestion(q);
    setIsAdding(false);
  }

  // Gửi lưu Form Câu hỏi (Thêm/Sửa)
  function handleSaveQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!formQuestion.trim()) return setError("Vui lòng nhập nội dung câu hỏi.");
    if (formOptions.some(opt => !opt.trim())) return setError("Vui lòng điền đủ 4 đáp án.");
    if (!formExplanation.trim()) return setError("Vui lòng nhập giải thích.");

    const questionId = editingQuestion ? editingQuestion.id : null;
    const payload = {
      question: formQuestion.trim(),
      options: formOptions.map(o => o.trim()),
      correctAnswer: formCorrectAnswer,
      explanation: formExplanation.trim(),
      order_index: formOrderIndex,
      grade: formGrade,
      is_active: formIsActive,
    };

    startTransition(async () => {
      const res = await updateQuizQuestion(questionId, payload);
      if (res.success) {
        setSuccess("Lưu câu hỏi thành công!");
        setError(null);
        if (questionId) {
          setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, ...payload } : q).sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)));
          setEditingQuestion(null);
        } else {
          window.location.reload();
        }
        setIsAdding(false);
      } else {
        setError(res.error || "Có lỗi xảy ra khi lưu câu hỏi.");
      }
    });
  }

  // Ẩn/hiện nhanh câu hỏi từ danh sách
  function handleToggleActive(q: QuizQuestion) {
    const nextVal = !(q.is_active ?? true);
    startTransition(async () => {
      const res = await toggleQuizQuestionActive(q.id, nextVal);
      if (res.success) {
        setQuestions(prev =>
          prev.map(item => item.id === q.id ? { ...item, is_active: nextVal } : item)
        );
        setSuccess(`Đã ${nextVal ? "hiện" : "ẩn"} câu hỏi thành công!`);
        setError(null);
      } else {
        setError(res.error || "Không thể thay đổi trạng thái câu hỏi.");
      }
    });
  }

  // Xuất kết quả bài làm học sinh sang Excel
  function handleExportExcel() {
    if (filteredSubmissions.length === 0) {
      alert("Không có kết quả nào để xuất!");
      return;
    }

    const dataToExport = filteredSubmissions.map((sub, idx) => {
      const percent = Math.round((sub.score / sub.total_questions) * 100);
      const timeStr = sub.completed_at
        ? new Date(sub.completed_at).toLocaleString("vi-VN", {
            timeZone: "Asia/Ho_Chi_Minh",
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : "—";

      return {
        "STT": idx + 1,
        "Họ và tên học sinh": sub.student_name,
        "Lớp": sub.class_name,
        "Số câu đúng": `${sub.score}/${sub.total_questions}`,
        "Tỉ lệ (%)": `${percent}%`,
        "Thời gian nộp bài": timeStr,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ket_qua_bai_lam");

    const maxLens = Object.keys(dataToExport[0]).map(key => {
      let maxLen = key.length;
      dataToExport.forEach(row => {
        const val = String(row[key as keyof typeof row] ?? "");
        if (val.length > maxLen) maxLen = val.length;
      });
      return { wch: maxLen + 3 };
    });
    worksheet["!cols"] = maxLens;

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ket_qua_lam_bai_trac_nghiem.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Xoá câu hỏi
  function handleDeleteQuestion(id: string) {
    if (!confirm("Bạn có chắc chắn muốn xoá câu hỏi này?")) return;
    startTransition(async () => {
      const res = await deleteQuizQuestion(id);
      if (res.success) {
        setQuestions(prev => prev.filter(q => q.id !== id));
        setSuccess("Xoá câu hỏi thành công!");
      } else {
        setError(res.error || "Không thể xoá câu hỏi.");
      }
    });
  }

  // Lọc danh sách nộp bài
  const filteredSubmissions = submissions.filter(sub =>
    sub.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.class_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/dashboard" className="text-slate-600 hover:text-slate-900 flex items-center gap-1 text-sm font-medium">
          <ChevronLeft className="size-4" /> Quay lại
        </Link>
      </div>

      {/* Tabs bar */}
      <div className="flex border-b border-slate-200">
        <button
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${activeTab === "questions"
            ? "border-primary text-primary"
            : "border-transparent text-muted-foreground hover:text-slate-900"
            }`}
          onClick={() => setActiveTab("questions")}
        >
          <BookOpen className="size-4" />
          Ngân hàng câu hỏi ({questions.length})
        </button>
        <button
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${activeTab === "submissions"
            ? "border-primary text-primary"
            : "border-transparent text-muted-foreground hover:text-slate-900"
            }`}
          onClick={() => setActiveTab("submissions")}
        >
          <GraduationCap className="size-4" />
          Kết quả làm bài ({submissions.length})
        </button>
      </div>

      {/* Thông báo */}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-sm font-semibold animate-in fade-in duration-200">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm font-semibold animate-in fade-in duration-200">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Bộ lọc Khối lớp dành cho Tab Câu hỏi */}
      {activeTab === "questions" && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-700">Lọc theo Khối lớp:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedGradeFilter("all")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  selectedGradeFilter === "all"
                    ? "bg-primary text-white"
                    : "bg-white hover:bg-slate-100 border text-slate-700"
                }`}
              >
                Tất cả
              </button>
              {[1, 2, 3, 4, 5].map(g => (
                <button
                  key={g}
                  onClick={() => setSelectedGradeFilter(g)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    selectedGradeFilter === g
                      ? "bg-primary text-white"
                      : "bg-white hover:bg-slate-100 border text-slate-700"
                  }`}
                >
                  Khối {g}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleOpenAdd} size="sm" className="bg-primary hover:bg-primary/95 text-white font-bold rounded-xl self-start sm:self-auto cursor-pointer">
            <Plus className="size-4 mr-1" /> Thêm câu hỏi
          </Button>
        </div>
      )}

      {/* TAB CÂU HỎI TRẮC NGHIỆM */}
      {activeTab === "questions" && (
        <div className="space-y-4">
          {questions.filter(q => selectedGradeFilter === "all" ? true : q.grade === selectedGradeFilter).length === 0 ? (
            <Card className="border-slate-200 shadow-sm rounded-2xl">
              <CardContent className="p-8 text-center text-muted-foreground font-normal">
                Chưa có câu hỏi nào cho bộ lọc này. Hãy nhấn "Thêm câu hỏi" để bắt đầu.
              </CardContent>
            </Card>
          ) : (
            questions
              .filter(q => selectedGradeFilter === "all" ? true : q.grade === selectedGradeFilter)
              .map((q, idx) => (
                <Card key={q.id || idx} className={`transition-all shadow-sm rounded-2xl border-slate-200/80 hover:border-slate-300 ${(q.is_active ?? true) ? "" : "opacity-75 bg-slate-50"}`}>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            Câu hỏi {q.order_index ?? idx + 1}
                          </span>
                          <span className="bg-sky-100 text-sky-850 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase">
                            Khối {q.grade ?? 4}
                          </span>
                          {!(q.is_active ?? true) && (
                            <span className="bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase">
                              Đang ẩn
                            </span>
                          )}
                        </div>
                        <h3 className="font-extrabold text-slate-900 text-base leading-snug">{q.question}</h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(q)}
                          disabled={isPending}
                          title={(q.is_active ?? true) ? "Ẩn câu hỏi đối với học sinh" : "Hiện câu hỏi đối với học sinh"}
                          className={`size-8 rounded-lg ${(q.is_active ?? true) ? "text-slate-600 hover:text-rose-600 hover:bg-rose-50" : "text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"}`}
                        >
                          {(q.is_active ?? true) ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(q)}
                          disabled={isPending}
                          className="size-8 text-slate-600 hover:text-primary rounded-lg"
                        >
                          <Edit2 className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteQuestion(q.id || "")}
                          disabled={isPending}
                          className="size-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = optIdx === q.correctAnswer;
                        return (
                          <div
                            key={optIdx}
                            className={`p-3 rounded-xl border text-sm font-semibold flex items-center gap-2 ${
                              isCorrect
                                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                : "bg-white border-slate-100 text-slate-600"
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                              isCorrect
                                ? "bg-emerald-500 text-white"
                                : "bg-slate-100 text-slate-500"
                            }`}>
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="truncate">{opt}</span>
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="text-xs text-muted-foreground bg-slate-50 border border-slate-100 p-3 rounded-xl font-normal leading-relaxed">
                        <span className="font-extrabold text-slate-800 block mb-0.5">💡 Giải thích:</span>
                        {q.explanation}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
          )}
        </div>
      )}

      {/* TAB KẾT QUẢ LÀM BÀI */}
      {activeTab === "submissions" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="size-4 text-muted-foreground ml-1" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm theo tên học sinh, tên lớp..."
                className="border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 font-semibold text-sm shadow-none"
              />
            </div>
            <Button
              onClick={handleExportExcel}
              variant="outline"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 font-bold rounded-xl gap-1.5 self-end sm:self-auto cursor-pointer"
            >
              <FileSpreadsheet className="size-4" />
              Xuất Excel
            </Button>
          </div>

          <div className="bg-white rounded-2xl border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/75 border-b font-extrabold text-slate-700">
                    <th className="p-4">Học sinh</th>
                    <th className="p-4">Lớp</th>
                    <th className="p-4 text-center">Số câu đúng</th>
                    <th className="p-4 text-center">Số điểm cộng</th>
                    <th className="p-4">Thời gian nộp</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground font-normal">
                        Chưa có học sinh nào nộp bài.
                      </td>
                    </tr>
                  ) : (
                    filteredSubmissions.map((sub, index) => {
                      const percent = Math.round((sub.score / sub.total_questions) * 100);
                      let timeStr = "—";
                      if (sub.completed_at) {
                        const date = new Date(sub.completed_at);
                        const formatter = new Intl.DateTimeFormat("en-US", {
                          timeZone: "Asia/Ho_Chi_Minh",
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        });
                        const parts = formatter.formatToParts(date);
                        const partMap = Object.fromEntries(parts.map(p => [p.type, p.value]));
                        timeStr = `${partMap.hour}:${partMap.minute} ${partMap.day}-${partMap.month}-${partMap.year}`;
                      }

                      return (
                        <tr key={sub.id || index} className="border-b hover:bg-slate-50/50 font-semibold text-slate-800">
                          <td className="p-4 font-extrabold text-slate-900">{sub.student_name}</td>
                          <td className="p-4">{sub.class_name}</td>
                          <td className="p-4 text-center text-slate-600 font-bold">
                            {sub.score}/{sub.total_questions} ({percent}%)
                          </td>
                          <td className="p-4 text-center text-emerald-600 font-black">
                            +{sub.score}đ
                          </td>
                          <td className="p-4 text-xs font-normal text-muted-foreground">{timeStr}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* FORM MODAL SOẠN THẢO CÂU HỎI (Thêm/Sửa) */}
      {(isAdding || editingQuestion) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-lg shadow-2xl border-slate-100 rounded-3xl overflow-hidden bg-white max-h-[95vh] flex flex-col">
            <div className="bg-primary p-5 text-white flex-shrink-0">
              <h3 className="font-extrabold text-lg flex items-center gap-2">
                <Sparkles className="size-5" />
                {editingQuestion ? "✏️ Chỉnh sửa câu hỏi" : "➕ Thêm câu hỏi trắc nghiệm mới"}
              </h3>
              <p className="text-xs text-blue-100 font-normal mt-1">
                Nhập câu hỏi, 4 đáp án tùy chọn và cấu hình đáp án đúng cùng lời giải thích bên dưới.
              </p>
            </div>

            <form onSubmit={handleSaveQuestion} className="p-6 space-y-4 overflow-y-auto flex-1">
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl flex items-start gap-2 text-xs font-bold animate-in shake duration-300">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl flex items-start gap-2 text-xs font-bold">
                  <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="questionText" className="font-bold">Nội dung câu hỏi</Label>
                <textarea
                  id="questionText"
                  rows={2}
                  value={formQuestion}
                  onChange={e => setFormQuestion(e.target.value)}
                  placeholder="Nhập nội dung câu hỏi trắc nghiệm..."
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-bold"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="font-bold">4 đáp án lựa chọn</Label>
                {formOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500 shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <Input
                      value={opt}
                      onChange={e => {
                        const newOpts = [...formOptions];
                        newOpts[idx] = e.target.value;
                        setFormOptions(newOpts);
                      }}
                      placeholder={`Nhập lựa chọn ${String.fromCharCode(65 + idx)}...`}
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="correctAnswerSelect" className="font-bold">Đáp án chính xác</Label>
                  <select
                    id="correctAnswerSelect"
                    value={formCorrectAnswer}
                    onChange={e => setFormCorrectAnswer(parseInt(e.target.value))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-bold"
                  >
                    {formOptions.map((_, idx) => (
                      <option key={idx} value={idx}>Đáp án {String.fromCharCode(65 + idx)}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="gradeSelect" className="font-bold">Dành cho Khối</Label>
                  <select
                    id="gradeSelect"
                    value={formGrade}
                    onChange={e => setFormGrade(parseInt(e.target.value))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-bold"
                  >
                    {[1, 2, 3, 4, 5].map(g => (
                      <option key={g} value={g}>Khối {g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="orderIndexInput" className="font-bold">Thứ tự câu hỏi</Label>
                  <Input
                    id="orderIndexInput"
                    type="number"
                    value={formOrderIndex}
                    onChange={e => setFormOrderIndex(parseInt(e.target.value) || 0)}
                    min={0}
                    required
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    id="isActiveCheckbox"
                    type="checkbox"
                    checked={formIsActive}
                    onChange={e => setFormIsActive(e.target.checked)}
                    className="size-4 rounded border-slate-300 accent-primary"
                  />
                  <Label htmlFor="isActiveCheckbox" className="font-bold text-sm cursor-pointer select-none">
                    Hiển thị đối với học sinh
                  </Label>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="explanationText" className="font-bold">Giải thích lời giải</Label>
                <textarea
                  id="explanationText"
                  rows={2}
                  value={formExplanation}
                  onChange={e => setFormExplanation(e.target.value)}
                  placeholder="Giải thích vì sao đáp án đó đúng để giúp học sinh nắm vững kiến thức..."
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-bold"
                  required
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t flex-shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingQuestion(null);
                  }}
                  disabled={isPending}
                  className="rounded-xl"
                >
                  Huỷ
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-primary hover:bg-primary/95 text-white font-bold rounded-xl"
                >
                  {isPending ? "Đang lưu..." : "Lưu câu hỏi"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
