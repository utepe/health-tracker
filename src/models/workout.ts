export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'core'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'cardio';

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'cable'
  | 'machine'
  | 'bodyweight'
  | 'kettlebell'
  | 'bands'
  | 'other';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  instructions: string;
  isCustom: boolean;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: TemplateExercise[];
  lastPerformed: string | null;
  createdAt: string;
}

export interface TemplateExercise {
  exerciseId: string;
  order: number;
  targetSets: number;
  supersetGroup: string | null;
  restSeconds: number;
  notes: string | null;
}

export type SessionStatus = 'active' | 'completed' | 'cancelled';

export interface WorkoutSession {
  id: string;
  templateId: string | null;
  name: string;
  startTime: string;
  endTime: string | null;
  status: SessionStatus;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  caloriesBurned: number | null;
}

export type SetType = 'working' | 'warmup' | 'dropset' | 'failure';

export interface CompletedWorkoutExercise {
  exerciseId: string;
  sets: WorkoutSet[];
}

export interface CompletedWorkout {
  id: string;
  name: string;
  templateId: string | null;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  totalVolumeKg: number;
  prCount: number;
  exercises: CompletedWorkoutExercise[];
}

export interface WorkoutSet {
  id: string;
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  type: SetType;
  weight: number | null; // kg
  reps: number | null;
  rpe: number | null; // 1-10
  durationSeconds: number | null; // for timed exercises
  restSeconds: number | null; // per-set rest override (null = use exercise default)
  isPersonalRecord: boolean;
  completedAt: string;
}
