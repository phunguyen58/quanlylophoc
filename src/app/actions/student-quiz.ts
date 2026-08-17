"use server";

import { createClient } from "@/lib/supabase/server";
import { DEFAULT_QUIZ_QUESTIONS, STATIC_VIDEOS } from "@/lib/student-quiz-data";
import { QuizQuestion, QuizSubmission, LessonVideo } from "@/types/student-quiz";
import { revalidatePath } from "next/cache";

// Tải danh sách câu hỏi trắc nghiệm (nếu lỗi hoặc bảng trống, trả về bộ 10 câu mặc định)
export async function getQuizQuestions(grade?: number, includeInactive = false): Promise<QuizQuestion[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("quiz_questions")
      .select("*");
    
    if (grade !== undefined) {
      query = query.eq("grade", grade);
    }
    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query.order("order_index", { ascending: true });

    if (error || !data || data.length === 0) {
      if (grade === undefined || grade === 4) {
        return DEFAULT_QUIZ_QUESTIONS;
      }
      return [];
    }

    interface DbQuizQuestion {
      id: string;
      question: string;
      options: string[];
      correct_answer: number;
      explanation: string;
      order_index: number;
      grade: number;
      is_active: boolean;
    }

    return (data as DbQuizQuestion[]).map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      correctAnswer: q.correct_answer,
      explanation: q.explanation,
      order_index: q.order_index,
      grade: q.grade,
      is_active: q.is_active,
    }));
  } catch {
    return grade === undefined || grade === 4 ? DEFAULT_QUIZ_QUESTIONS : [];
  }
}

// Lưu kết quả làm bài của học sinh (cho phép nộp ẩn danh)
export async function submitQuizResult(
  studentName: string,
  className: string,
  score: number,
  totalQuestions: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("quiz_submissions").insert({
      student_name: studentName,
      class_name: className,
      score,
      total_questions: totalQuestions,
    });
    if (error) throw error;
    
    revalidatePath("/quiz-management");
    return { success: true };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Không thể gửi kết quả làm bài.";
    return { success: false, error: errMsg };
  }
}

// Tải toàn bộ kết quả làm bài của học sinh (chỉ giáo viên đã đăng nhập)
export async function getQuizSubmissions(): Promise<QuizSubmission[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("quiz_submissions")
      .select("*")
      .order("completed_at", { ascending: false });

    if (error || !data) return [];

    interface DbQuizSubmission {
      id: string;
      student_name: string;
      class_name: string;
      score: number;
      total_questions: number;
      completed_at: string;
    }

    return (data as DbQuizSubmission[]).map((s) => ({
      id: s.id,
      student_name: s.student_name,
      class_name: s.class_name,
      score: s.score,
      total_questions: s.total_questions,
      completed_at: s.completed_at,
    }));
  } catch {
    return [];
  }
}

// Thêm hoặc cập nhật câu hỏi trắc nghiệm (yêu cầu giáo viên)
export async function updateQuizQuestion(
  questionId: string | null,
  formData: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    orderIndex?: number;
    grade: number;
    is_active?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Đăng nhập đã hết hạn. Vui lòng đăng nhập lại." };

    const payload = {
      question: formData.question.trim(),
      options: formData.options.map(opt => opt.trim()),
      correct_answer: formData.correctAnswer,
      explanation: formData.explanation.trim(),
      order_index: formData.orderIndex ?? 0,
      grade: formData.grade,
      is_active: formData.is_active !== undefined ? formData.is_active : true,
    };

    let error;
    if (questionId) {
      const res = await supabase.from("quiz_questions").update(payload).eq("id", questionId);
      error = res.error;
    } else {
      const res = await supabase.from("quiz_questions").insert(payload);
      error = res.error;
    }

    if (error) {
      return { success: false, error: error.message || "Không thể lưu câu hỏi." };
    }

    revalidatePath("/quiz-management");
    revalidatePath("/login");
    return { success: true };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Có lỗi xảy ra khi lưu.";
    return { success: false, error: errMsg };
  }
}

// Ẩn/hiện nhanh câu hỏi
export async function toggleQuizQuestionActive(
  questionId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Đăng nhập đã hết hạn." };

    const { error } = await supabase
      .from("quiz_questions")
      .update({ is_active: isActive })
      .eq("id", questionId);

    if (error) {
      return { success: false, error: error.message || "Không thể thay đổi trạng thái câu hỏi." };
    }

    revalidatePath("/quiz-management");
    revalidatePath("/login");
    return { success: true };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Có lỗi xảy ra.";
    return { success: false, error: errMsg };
  }
}

// Xoá câu hỏi trắc nghiệm (yêu cầu giáo viên)
export async function deleteQuizQuestion(questionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Đăng nhập đã hết hạn." };

    const { error } = await supabase.from("quiz_questions").delete().eq("id", questionId);
    if (error) {
      return { success: false, error: error.message || "Không thể xoá câu hỏi." };
    }

    revalidatePath("/quiz-management");
    revalidatePath("/login");
    return { success: true };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Có lỗi xảy ra khi xoá.";
    return { success: false, error: errMsg };
  }
}

// Tải danh sách video học liệu số (nếu trống, trả về mặc định cho khối 4)
export async function getLessonVideos(grade?: number): Promise<LessonVideo[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("lesson_videos")
      .select("*");

    if (grade !== undefined) {
      query = query.eq("grade", grade);
    }

    const { data, error } = await query.order("order_index", { ascending: true });

    if (error || !data || data.length === 0) {
      if (grade === undefined || grade === 4) {
        return STATIC_VIDEOS;
      }
      return [];
    }

    interface DbLessonVideo {
      id: string;
      title: string;
      description: string;
      youtube_url: string;
      grade: number;
      order_index: number;
    }

    return (data as DbLessonVideo[]).map((v) => ({
      id: v.id,
      title: v.title,
      description: v.description,
      youtubeUrl: v.youtube_url,
      grade: v.grade,
      order_index: v.order_index,
    }));
  } catch {
    return grade === undefined || grade === 4 ? STATIC_VIDEOS : [];
  }
}

// Thêm hoặc cập nhật video bài giảng
export async function updateLessonVideo(
  videoId: string | null,
  formData: {
    title: string;
    description: string;
    youtubeUrl: string;
    grade: number;
    orderIndex?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Đăng nhập đã hết hạn. Vui lòng đăng nhập lại." };

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      youtube_url: formData.youtubeUrl.trim(),
      grade: formData.grade,
      order_index: formData.orderIndex ?? 0,
    };

    let error;
    if (videoId) {
      const res = await supabase.from("lesson_videos").update(payload).eq("id", videoId);
      error = res.error;
    } else {
      const res = await supabase.from("lesson_videos").insert(payload);
      error = res.error;
    }

    if (error) {
      return { success: false, error: error.message || "Không thể lưu video bài giảng." };
    }

    revalidatePath("/quiz-management");
    revalidatePath("/login");
    return { success: true };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Có lỗi xảy ra khi lưu video.";
    return { success: false, error: errMsg };
  }
}

// Xoá video bài giảng
export async function deleteLessonVideo(videoId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Đăng nhập đã hết hạn." };

    const { error } = await supabase.from("lesson_videos").delete().eq("id", videoId);
    if (error) {
      return { success: false, error: error.message || "Không thể xoá video bài giảng." };
    }

    revalidatePath("/quiz-management");
    revalidatePath("/login");
    return { success: true };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Có lỗi xảy ra khi xoá video.";
    return { success: false, error: errMsg };
  }
}
