import { MetricRecord } from './common';

export interface DailyActivity extends MetricRecord {
  steps: number;
  activeMinutes: number;
  caloriesTotal: number;
  caloriesActive: number;
  distanceMeters: number;
  floorsClimbed: number | null;
}

export type WorkoutType =
  | 'run'
  | 'cycle'
  | 'swim'
  | 'walk'
  | 'hike'
  | 'strength'
  | 'yoga'
  | 'cardio'
  | 'other';

export interface WorkoutRecord extends MetricRecord {
  activityType: WorkoutType;
  name: string;
  durationMinutes: number;
  caloriesBurned: number;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  vo2max: number | null;
  trainingLoad: number | null;
  distanceMeters: number | null;
}
