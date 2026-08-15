export type ParticipationEvent = {
  id: string;
  student_id: string;
  points: number;
  created_at: string;
};

export type ParticipationCounts = Record<string, number>;

export type UndoableParticipation = {
  eventId: string;
  studentId: string;
  studentName: string;
};
