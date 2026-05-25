import { MetricRecord } from './common';

export interface DailyHeartMetrics extends MetricRecord {
  restingHR: number | null;
  avgHR: number | null;
  maxHR: number | null;
  hrvAvg: number | null; // ms (RMSSD)
  stressScore: number | null; // 0-100
  readinessScore: number | null; // 0-100 (Garmin Body Battery / Fitbit Readiness / Google Readiness)
  readinessHigh: number | null; // Highest point in day (Garmin: Body Battery peak)
  readinessLow: number | null; // Lowest point in day
}
