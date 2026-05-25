import { SleepRecord } from '../models/sleep';
import { DailyActivity } from '../models/activity';
import { DailyHeartMetrics } from '../models/heart';
import { DailyRecovery } from '../models/recovery';
import { format, subDays } from 'date-fns';

const today = format(new Date(), 'yyyy-MM-dd');

export const mockSleep: SleepRecord = {
  id: 'mock_sleep_today',
  source: 'garmin',
  sourceId: 'garmin_sleep_today',
  date: today,
  startTime: `${today}T22:45:00`,
  endTime: `${format(new Date(), 'yyyy-MM-dd')}T06:12:00`,
  durationMinutes: 447,
  deepMinutes: 82,
  lightMinutes: 210,
  remMinutes: 118,
  awakeMinutes: 37,
  sleepScore: 82,
  createdAt: new Date().toISOString(),
  syncedAt: null,
};

export const mockActivity: DailyActivity = {
  id: 'mock_activity_today',
  source: 'apple_health',
  sourceId: 'ahk_activity_today',
  date: today,
  steps: 8432,
  activeMinutes: 42,
  caloriesTotal: 2180,
  caloriesActive: 485,
  distanceMeters: 6240,
  floorsClimbed: 8,
  createdAt: new Date().toISOString(),
  syncedAt: null,
};

export const mockHeart: DailyHeartMetrics = {
  id: 'mock_heart_today',
  source: 'garmin',
  sourceId: 'garmin_heart_today',
  date: today,
  restingHR: 52,
  avgHR: 68,
  maxHR: 156,
  hrvAvg: 48,
  stressScore: 32,
  readinessScore: 72,
  readinessHigh: 89,
  readinessLow: 28,
  createdAt: new Date().toISOString(),
  syncedAt: null,
};

export const mockRecovery: DailyRecovery = {
  id: 'mock_recovery_today',
  source: 'combined',
  sourceId: 'computed_recovery_today',
  date: today,
  recoveryScore: 78,
  hrv: 48,
  restingHR: 52,
  sleepScore: 82,
  bodyBattery: 72,
  createdAt: new Date().toISOString(),
  syncedAt: null,
};

// Simple seeded pseudo-random for stable mock data across renders
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function seededInt(seed: number, min: number, max: number): number {
  return min + Math.floor(seededRandom(seed) * (max - min));
}

// Historical data for trend charts (last 7 days)
// Generated once with stable values (seeded by day index)
export const weeklyMockData = (() => {
  const sleepHistory: SleepRecord[] = [];
  const activityHistory: DailyActivity[] = [];
  const heartHistory: DailyHeartMetrics[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
    const seed = i * 7;

    sleepHistory.push({
      id: `mock_sleep_${i}`,
      source: 'garmin',
      sourceId: `garmin_sleep_${date}`,
      date,
      startTime: `${date}T22:30:00`,
      endTime: `${date}T06:00:00`,
      durationMinutes: seededInt(seed + 1, 390, 480),
      deepMinutes: seededInt(seed + 2, 55, 100),
      lightMinutes: seededInt(seed + 3, 170, 240),
      remMinutes: seededInt(seed + 4, 80, 130),
      awakeMinutes: seededInt(seed + 5, 15, 45),
      sleepScore: seededInt(seed + 6, 68, 95),
      createdAt: new Date().toISOString(),
      syncedAt: null,
    });

    activityHistory.push({
      id: `mock_activity_${i}`,
      source: 'apple_health',
      sourceId: `ahk_activity_${date}`,
      date,
      steps: seededInt(seed + 10, 4500, 13000),
      activeMinutes: seededInt(seed + 11, 12, 65),
      caloriesTotal: seededInt(seed + 12, 1700, 2500),
      caloriesActive: seededInt(seed + 13, 180, 550),
      distanceMeters: seededInt(seed + 14, 2800, 8500),
      floorsClimbed: seededInt(seed + 15, 2, 15),
      createdAt: new Date().toISOString(),
      syncedAt: null,
    });

    heartHistory.push({
      id: `mock_heart_${i}`,
      source: 'garmin',
      sourceId: `garmin_heart_${date}`,
      date,
      restingHR: seededInt(seed + 20, 48, 58),
      avgHR: seededInt(seed + 21, 58, 75),
      maxHR: seededInt(seed + 22, 125, 170),
      hrvAvg: seededInt(seed + 23, 35, 58),
      stressScore: seededInt(seed + 24, 18, 55),
      readinessScore: seededInt(seed + 25, 45, 95),
      readinessHigh: seededInt(seed + 26, 70, 100),
      readinessLow: seededInt(seed + 27, 12, 40),
      createdAt: new Date().toISOString(),
      syncedAt: null,
    });
  }

  return { sleepHistory, activityHistory, heartHistory };
})();
