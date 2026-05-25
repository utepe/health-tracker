import { MetricRecord } from './common';

export interface SleepRecord extends MetricRecord {
  startTime: string;
  endTime: string;
  durationMinutes: number;
  deepMinutes: number;
  lightMinutes: number;
  remMinutes: number;
  awakeMinutes: number;
  sleepScore: number | null;
}
