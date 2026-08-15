export type PointValue = 1 | 2 | 5 | -1 | -2 | -5;

export type StudentPointEvent = {
  id: string;
  points: number;
  reason: string;
  created_at: string;
};

export type UndoablePointEvent = {
  eventId: string;
  studentId: string;
  studentName: string;
  points: number;
  reason: string;
};

export type StudentPointTotals = Record<string, number>;
