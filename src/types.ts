export interface ExerciseTemplate {
  name: string;
  sets: number;
  reps: number;
}

export interface Template {
  id: string;
  name: string;
  exercises: ExerciseTemplate[];
  dayOfWeek?: string;
  createdAt?: string;
  updatedAt?: string;
  order?: number;
}
