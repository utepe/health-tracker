import { SleepRecord } from '../models/sleep';
import { DailyHeartMetrics } from '../models/heart';

export interface SleepScoreBreakdown {
  overall: number; // 0-100
  duration: { score: number; label: string };
  bedtime: { score: number; label: string };
  architecture: { score: number; label: string };
  stressRecovery: { score: number; label: string };
  interruptions: { score: number; label: string };
}

/**
 * Compute sleep score combining Apple Health + Garmin approaches:
 *
 * 1. Duration (20%) - total sleep time vs age-based recommendation
 * 2. Bedtime (15%) - consistency/regularity of bedtime vs target
 * 3. Sleep Architecture (25%) - deep/light/REM proportions
 * 4. Stress & Recovery (20%) - HRV-based autonomic recovery during sleep
 * 5. Interruptions (20%) - awake time and restlessness
 */
export function computeSleepScore(
  record: SleepRecord,
  heartMetrics?: DailyHeartMetrics | null,
  goalMinutes: number = 480,
  targetBedtime: number = 22.5 // 10:30 PM in decimal hours
): SleepScoreBreakdown {
  const duration = computeDurationScore(record.durationMinutes, goalMinutes);
  const bedtime = computeBedtimeScore(record.startTime, targetBedtime);
  const architecture = computeArchitectureScore(record);
  const stressRecovery = computeStressRecoveryScore(heartMetrics);
  const interruptions = computeInterruptionScore(record.awakeMinutes, record.durationMinutes);

  const overall = Math.round(
    duration.score * 0.20 +
    bedtime.score * 0.15 +
    architecture.score * 0.25 +
    stressRecovery.score * 0.20 +
    interruptions.score * 0.20
  );

  return { overall, duration, bedtime, architecture, stressRecovery, interruptions };
}

// --- Duration (Apple Health + Garmin) ---
// Compares total sleep against globally accepted age-based recommendations

function computeDurationScore(
  actualMinutes: number,
  goalMinutes: number
): { score: number; label: string } {
  const ratio = actualMinutes / goalMinutes;
  let score: number;

  if (ratio >= 0.9 && ratio <= 1.1) {
    score = 100;
  } else if (ratio >= 0.8 && ratio < 0.9) {
    score = 85;
  } else if (ratio >= 0.7 && ratio < 0.8) {
    score = 70;
  } else if (ratio < 0.7) {
    score = Math.max(10, Math.round(ratio * 100));
  } else {
    // Oversleeping penalty
    score = Math.max(70, Math.round(100 - (ratio - 1.1) * 50));
  }

  const hours = Math.floor(actualMinutes / 60);
  const mins = actualMinutes % 60;
  let label: string;
  if (score >= 85) label = `${hours}h ${mins}m - Optimal`;
  else if (score >= 70) label = `${hours}h ${mins}m - Fair`;
  else label = `${hours}h ${mins}m - Insufficient`;

  return { score, label };
}

// --- Bedtime Consistency (Apple Health) ---
// How close your actual bedtime is to your target

function computeBedtimeScore(
  startTime: string,
  targetBedtime: number
): { score: number; label: string } {
  const date = new Date(startTime);
  let bedtimeHour = date.getHours() + date.getMinutes() / 60;
  // If before 6 AM, treat as previous night
  if (bedtimeHour < 6) bedtimeHour += 24;

  const deviationHours = Math.abs(bedtimeHour - targetBedtime);

  let score: number;
  if (deviationHours <= 0.5) score = 100;
  else if (deviationHours <= 1) score = 85;
  else if (deviationHours <= 1.5) score = 70;
  else if (deviationHours <= 2) score = 55;
  else score = Math.max(20, Math.round(55 - (deviationHours - 2) * 15));

  const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  let label: string;
  if (score >= 85) label = `${timeStr} - Consistent`;
  else if (score >= 60) label = `${timeStr} - Slightly off`;
  else label = `${timeStr} - Irregular`;

  return { score, label };
}

// --- Sleep Architecture (Garmin) ---
// Measures time in deep/light/REM and whether proportions are healthy
// Ideal: Deep 15-20%, REM 20-25%, Light 50-60%

function computeArchitectureScore(record: SleepRecord): { score: number; label: string } {
  const totalSleep = record.deepMinutes + record.lightMinutes + record.remMinutes;
  if (totalSleep === 0) return { score: 0, label: 'No stage data' };

  const deepPct = record.deepMinutes / totalSleep;
  const remPct = record.remMinutes / totalSleep;
  const lightPct = record.lightMinutes / totalSleep;

  const deepScore = scoreRange(deepPct, 0.15, 0.20, 0.08, 0.30);
  const remScore = scoreRange(remPct, 0.20, 0.25, 0.12, 0.35);
  const lightScore = scoreRange(lightPct, 0.45, 0.60, 0.30, 0.75);

  const score = Math.round((deepScore + remScore + lightScore) / 3);

  let label: string;
  if (score >= 85) label = 'Balanced stages';
  else if (score >= 70) label = 'Slightly imbalanced';
  else if (score >= 50) label = 'Imbalanced stages';
  else label = 'Poor architecture';

  return { score, label };
}

function scoreRange(
  value: number,
  idealLow: number,
  idealHigh: number,
  minBound: number,
  maxBound: number
): number {
  if (value >= idealLow && value <= idealHigh) return 100;
  if (value < idealLow) {
    if (value <= minBound) return 20;
    return Math.round(20 + ((value - minBound) / (idealLow - minBound)) * 80);
  }
  if (value >= maxBound) return 20;
  return Math.round(20 + ((maxBound - value) / (maxBound - idealHigh)) * 80);
}

// --- Stress & Recovery (Garmin) ---
// Uses HRV to gauge autonomic nervous system recovery state during sleep
// Higher HRV = better parasympathetic activity = body actively resting

function computeStressRecoveryScore(
  heartMetrics?: DailyHeartMetrics | null
): { score: number; label: string } {
  if (!heartMetrics) {
    return { score: 75, label: 'No HRV data (estimated)' };
  }

  let score = 75;

  // HRV component: higher is better (typical adult range 20-80ms)
  if (heartMetrics.hrvAvg != null) {
    if (heartMetrics.hrvAvg >= 55) score = 98;
    else if (heartMetrics.hrvAvg >= 45) score = 90;
    else if (heartMetrics.hrvAvg >= 38) score = 80;
    else if (heartMetrics.hrvAvg >= 30) score = 65;
    else if (heartMetrics.hrvAvg >= 20) score = 45;
    else score = 25;
  }

  // Adjust by stress score if available (lower stress during sleep = better)
  if (heartMetrics.stressScore != null) {
    if (heartMetrics.stressScore <= 20) score = Math.min(100, score + 5);
    else if (heartMetrics.stressScore >= 60) score = Math.max(15, score - 15);
    else if (heartMetrics.stressScore >= 45) score = Math.max(25, score - 8);
  }

  score = Math.min(100, Math.max(0, score));

  let label: string;
  if (score >= 85) label = 'Excellent recovery';
  else if (score >= 70) label = 'Good recovery';
  else if (score >= 50) label = 'Moderate recovery';
  else label = 'Poor recovery';

  return { score, label };
}

// --- Interruptions (Apple Health + Garmin) ---
// Tracks restlessness and time spent awake (especially segments > 5 min)

function computeInterruptionScore(
  awakeMinutes: number,
  totalDurationMinutes: number
): { score: number; label: string } {
  const totalWindow = totalDurationMinutes + awakeMinutes;
  if (totalWindow === 0) return { score: 0, label: 'No data' };

  const awakeRatio = awakeMinutes / totalWindow;

  let score: number;
  if (awakeRatio <= 0.03) score = 100;
  else if (awakeRatio <= 0.06) score = 90;
  else if (awakeRatio <= 0.10) score = 75;
  else if (awakeRatio <= 0.15) score = 60;
  else if (awakeRatio <= 0.20) score = 40;
  else score = Math.max(10, Math.round(40 - (awakeRatio - 0.2) * 150));

  let label: string;
  if (score >= 85) label = `${awakeMinutes}m awake - Minimal`;
  else if (score >= 60) label = `${awakeMinutes}m awake - Moderate`;
  else label = `${awakeMinutes}m awake - Frequent`;

  return { score, label };
}
