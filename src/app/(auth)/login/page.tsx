import { getQuizQuestions, getLessonVideos } from "@/app/actions/student-quiz";
import { StudentQuizClient } from "./student-quiz-client";
 
export const metadata = {
  title: "Bài tập Kiến thức tin học — Kết nối tri thức với cuộc sống",
  description: "Trang làm bài tập trực tuyến môn Kiến thức tin học dành cho học sinh tiểu học",
};
 
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const { next } = await searchParams;
  const returnPath =
    typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
      ? next
      : undefined;
 
  // Tải dữ liệu ban đầu cho Khối 4
  const [questions, videos] = await Promise.all([
    getQuizQuestions(4),
    getLessonVideos(4),
  ]);
 
  return (
    <StudentQuizClient
      initialQuestions={questions}
      initialVideos={videos}
      returnPath={returnPath}
    />
  );
}
