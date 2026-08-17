import { getLessonVideos } from "@/app/actions/student-quiz";
import { LearningMaterialsClient } from "./learning-materials-client";

export const metadata = {
  title: "Quản lý học liệu số — QLLH",
  description: "Trang quản lý video bài giảng và tài liệu bài giảng cho giáo viên",
};

export default async function LearningMaterialsPage() {
  const videos = await getLessonVideos();

  return (
    <div className="space-y-6">
      <LearningMaterialsClient initialVideos={videos} />
    </div>
  );
}
