import { MetricRecord } from './common';

export interface DailyRecovery extends MetricRecord {
  recoveryScore: number; // Computed 0-100
  hrv: number | null;
  restingHR: number | null;
  sleepScore: number | null;
  bodyBattery: number | null;
}
