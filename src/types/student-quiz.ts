export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // 0-3 index
  explanation: string;
  order_index?: number;
  grade?: number;
  is_active?: boolean;
}

export interface QuizSubmission {
  id: string;
  student_name: string;
  class_name: string;
  score: number;
  total_questions: number;
  completed_at: string;
}

export interface LessonVideo {
  id?: string;
  title: string;
  description: string;
  youtubeUrl: string;
  grade?: number;
  order_index?: number;
}
