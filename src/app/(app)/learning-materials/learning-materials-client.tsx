"use client";

import { useState, useTransition } from "react";
import { LessonVideo } from "@/types/student-quiz";
import { updateLessonVideo, deleteLessonVideo } from "@/app/actions/student-quiz";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus, Edit2, Trash2, Search, CheckCircle2, AlertCircle,
  Presentation, FileText, ExternalLink, Video, ChevronLeft
} from "lucide-react";
import Link from "next/link";

interface Props {
  initialVideos?: LessonVideo[];
}

export function LearningMaterialsClient({ initialVideos = [] }: Props) {
  const [videos, setVideos] = useState<LessonVideo[]>(initialVideos);
  const [searchQuery, setSearchQuery] = useState("");

  // Lọc theo Khối
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<number | "all">("all");

  // Trạng thái Form soạn thảo học liệu số
  const [isVideoFormOpen, setIsVideoFormOpen] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [videoYoutubeUrl, setVideoYoutubeUrl] = useState("");
  const [videoGrade, setVideoGrade] = useState<number>(4);
  const [videoOrderIndex, setVideoOrderIndex] = useState<number>(1);

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleEditVideo = (v: LessonVideo) => {
    setEditingVideoId(v.id || null);
    setVideoTitle(v.title);
    setVideoDescription(v.description || "");
    setVideoYoutubeUrl(v.youtubeUrl);
    setVideoGrade(v.grade || 4);
    setVideoOrderIndex(v.order_index || 1);
    setFormError(null);
    setFormSuccess(null);
    setIsVideoFormOpen(true);
  };

  const openNewVideo = () => {
    setEditingVideoId(null);
    setVideoTitle("");
    setVideoDescription("");
    setVideoYoutubeUrl("");
    setVideoGrade(4);
    setVideoOrderIndex(videos.length + 1);
    setFormError(null);
    setFormSuccess(null);
    setIsVideoFormOpen(true);
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xoá học liệu này?")) return;

    startTransition(async () => {
      const res = await deleteLessonVideo(id);
      if (res.success) {
        setVideos(prev => prev.filter(item => item.id !== id));
      } else {
        alert(res.error || "Có lỗi xảy ra");
      }
    });
  };

  const submitVideoForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!videoTitle.trim()) {
      setFormError("Vui lòng nhập tiêu đề");
      return;
    }
    if (!videoYoutubeUrl.trim()) {
      setFormError("Vui lòng nhập đường dẫn liên kết");
      return;
    }

    startTransition(async () => {
      const res = await updateLessonVideo(editingVideoId || null, {
        title: videoTitle.trim(),
        description: videoDescription.trim(),
        youtubeUrl: videoYoutubeUrl.trim(),
        grade: videoGrade,
        orderIndex: videoOrderIndex,
      });

      if (res.success) {
        setFormSuccess(editingVideoId ? "Cập nhật học liệu thành công!" : "Thêm mới học liệu thành công!");
        
        setTimeout(() => {
          setIsVideoFormOpen(false);
          setEditingVideoId(null);
          window.location.reload();
        }, 1000);
      } else {
        setFormError(res.error || "Có lỗi xảy ra khi lưu dữ liệu");
      }
    });
  };

  // Lọc danh sách học liệu hiển thị theo Khối và Từ khóa tìm kiếm
  const filteredVideos = videos
    .filter(v => selectedGradeFilter === "all" ? true : v.grade === selectedGradeFilter)
    .filter(v => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        v.title.toLowerCase().includes(q) ||
        (v.description || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => (a.order_index ?? 1) - (b.order_index ?? 1));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/dashboard" className="text-slate-600 hover:text-slate-900 flex items-center gap-1 text-sm font-medium">
          <ChevronLeft className="size-4" /> Quay lại
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Video className="size-6 text-indigo-600" />
            Quản lý Học liệu số
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý liên kết video bài giảng YouTube, tài liệu Google Slides hoặc Canva cho học sinh lớp 1 đến lớp 5.
          </p>
        </div>
        <Button
          onClick={openNewVideo}
          className="bg-indigo-600 hover:bg-indigo-750 font-bold rounded-xl"
        >
          <Plus className="size-4 mr-1.5" />
          Thêm học liệu mới
        </Button>
      </div>

      {/* FORM SOẠN THẢO (Modal) */}
      {isVideoFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-lg shadow-2xl border-indigo-100 rounded-3xl overflow-hidden bg-white max-h-[90vh] flex flex-col">
            <div className="bg-indigo-600 p-5 text-white flex-shrink-0">
              <h3 className="font-extrabold text-lg">
                {editingVideoId ? "✏️ Chỉnh sửa học liệu" : "➕ Thêm học liệu số mới"}
              </h3>
              <p className="text-xs text-indigo-100 font-normal mt-1">
                Nhập đầy đủ thông tin bên dưới để chia sẻ tài liệu bài giảng cho học sinh.
              </p>
            </div>
            
            <form onSubmit={submitVideoForm} className="p-6 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl flex items-start gap-2 text-sm font-bold animate-in shake duration-300">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl flex items-start gap-2 text-sm font-bold">
                  <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="videoTitle" className="font-bold">Tiêu đề học liệu</Label>
                <Input
                  id="videoTitle"
                  value={videoTitle}
                  onChange={e => setVideoTitle(e.target.value)}
                  placeholder="Ví dụ: Khám phá thế giới máy tính"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="videoDescription" className="font-bold">Mô tả ngắn</Label>
                <textarea
                  id="videoDescription"
                  value={videoDescription}
                  onChange={e => setVideoDescription(e.target.value)}
                  placeholder="Nhập mô tả ngắn gọn về bài học này..."
                  className="flex min-h-[70px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="videoYoutubeUrl" className="font-bold">Đường dẫn bài giảng (YouTube hoặc Google Slides)</Label>
                <Input
                  id="videoYoutubeUrl"
                  value={videoYoutubeUrl}
                  onChange={e => setVideoYoutubeUrl(e.target.value)}
                  placeholder="Ví dụ: Link YouTube hoặc liên kết Google Slides..."
                  required
                />
                <p className="text-[10px] text-muted-foreground font-normal">Hệ thống hỗ trợ hiển thị video trực tiếp đối với YouTube; hiển thị bìa liên kết đối với Google Slides hoặc Canva.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="videoGrade" className="font-bold">Khối lớp học</Label>
                  <select
                    id="videoGrade"
                    value={videoGrade}
                    onChange={e => setVideoGrade(parseInt(e.target.value))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-bold"
                  >
                    {[1, 2, 3, 4, 5].map(g => (
                      <option key={g} value={g}>Khối {g}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="videoOrderIndex" className="font-bold">Thứ tự hiển thị</Label>
                  <Input
                    id="videoOrderIndex"
                    type="number"
                    value={videoOrderIndex}
                    onChange={e => setVideoOrderIndex(parseInt(e.target.value) || 1)}
                    min={1}
                    required
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t flex-shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsVideoFormOpen(false)}
                  disabled={isPending}
                  className="rounded-xl"
                >
                  Đóng
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-indigo-600 hover:bg-indigo-750 font-bold rounded-xl"
                >
                  {isPending ? "Đang lưu..." : "Lưu học liệu"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* FILTER & SEARCH */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            variant={selectedGradeFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedGradeFilter("all")}
            className="rounded-full text-xs font-bold"
          >
            Tất cả Khối
          </Button>
          {[1, 2, 3, 4, 5].map(g => (
            <Button
              key={g}
              variant={selectedGradeFilter === g ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedGradeFilter(g)}
              className="rounded-full text-xs font-bold"
            >
              Khối {g}
            </Button>
          ))}
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tiêu đề, mô tả..."
            className="pl-9 h-9 rounded-xl text-xs font-bold"
          />
        </div>
      </div>

      {/* DANH SÁCH HỌC LIỆU SỐ */}
      {filteredVideos.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200 shadow-none rounded-3xl py-12 text-center text-muted-foreground font-normal">
          Không tìm thấy học liệu nào phù hợp với bộ lọc hiện tại.
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVideos.map((v, index) => (
            <Card key={v.id || index} className="hover:border-indigo-300 transition-all flex flex-col justify-between overflow-hidden shadow-sm hover:shadow">
              <CardContent className="p-4 space-y-3">
                <div className="aspect-video w-full relative bg-slate-100 rounded-xl overflow-hidden border flex items-center justify-center">
                  {v.youtubeUrl.includes("youtube.com") || v.youtubeUrl.includes("youtu.be") ? (
                    <iframe
                      src={v.youtubeUrl}
                      title={v.title}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  ) : v.youtubeUrl.includes("docs.google.com/presentation") ? (
                    <div className="w-full h-full bg-gradient-to-br from-amber-400 to-orange-500 flex flex-col items-center justify-center p-4 text-white text-center">
                      <Presentation className="size-10 mb-1" />
                      <span className="text-xs font-black uppercase tracking-wider">Bài giảng Slides</span>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-650 flex flex-col items-center justify-center p-4 text-white text-center">
                      <FileText className="size-10 mb-1" />
                      <span className="text-xs font-black uppercase tracking-wider">Tài liệu học liệu</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                      Thứ tự: {v.order_index ?? 1}
                    </span>
                    <span className="bg-indigo-100 text-indigo-850 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase">
                      Khối {v.grade ?? 4}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-base leading-snug line-clamp-1">{v.title}</h4>
                  <p className="text-xs text-muted-foreground font-normal line-clamp-2">{v.description}</p>
                </div>
              </CardContent>
              
              <div className="px-4 pb-4 pt-2 border-t border-slate-50 flex items-center justify-between">
                <a href={v.youtubeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-750 font-bold">
                  {v.youtubeUrl.includes("youtube.com") || v.youtubeUrl.includes("youtu.be") ? "Xem trên YouTube" : "Mở tài liệu liên kết"}
                  <ExternalLink className="size-3" />
                </a>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-slate-600 hover:text-primary rounded-lg"
                    onClick={() => handleEditVideo(v)}
                    disabled={isPending}
                  >
                    <Edit2 className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                    onClick={() => handleDeleteVideo(v.id || "")}
                    disabled={isPending}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
