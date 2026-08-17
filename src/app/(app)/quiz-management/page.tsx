import { getQuizQuestions, getQuizSubmissions } from "@/app/actions/student-quiz";
import { QuizManagementClient } from "./quiz-management-client";
 
export const metadata = {
  title: "Ngân hàng câu hỏi trắc nghiệm — QLLH",
  description: "Quản lý câu hỏi trắc nghiệm và xem kết quả làm bài của học sinh",
};
 
export default async function QuizManagementPage() {
  // Tải dữ liệu song song trên server
  const [questions, submissions] = await Promise.all([
    getQuizQuestions(undefined, true),
    getQuizSubmissions(),
  ]);
 
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý câu hỏi trắc nghiệm</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Quản lý ngân hàng câu hỏi trắc nghiệm Tin học và theo dõi kết quả làm bài.
        </p>
      </header>
 
      <QuizManagementClient
        initialQuestions={questions}
        initialSubmissions={submissions}
      />
    </div>
  );
}
