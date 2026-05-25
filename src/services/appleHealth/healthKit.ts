import AppleHealthKit, {
  HealthInputOptions,
  HealthKitPermissions,
  HealthValue,
} from 'react-native-health';
import { format, startOfDay, endOfDay } from 'date-fns';
import { SleepRecord } from '../../models/sleep';
import { DailyActivity } from '../../models/activity';
import { DailyHeartMetrics } from '../../models/heart';
import { v4 as uuid } from 'uuid';

const permissions: HealthKitPermissions = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.StepCount,
      AppleHealthKit.Constants.Permissions.HeartRate,
      AppleHealthKit.Constants.Permissions.RestingHeartRate,
      AppleHealthKit.Constants.Permissions.HeartRateVariabilitySDNN,
      AppleHealthKit.Constants.Permissions.SleepAnalysis,
      AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
      AppleHealthKit.Constants.Permissions.BasalEnergyBurned,
      AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
      AppleHealthKit.Constants.Permissions.Workout,
      AppleHealthKit.Constants.Permissions.Vo2Max,
    ],
    write: [],
  },
};

export function initHealthKit(): Promise<void> {
  return new Promise((resolve, reject) => {
    AppleHealthKit.initHealthKit(permissions, (error) => {
      if (error) {
        reject(new Error(`HealthKit init failed: ${error}`));
      } else {
        resolve();
      }
    });
  });
}

export function getSteps(date: Date): Promise<number> {
  return new Promise((resolve, reject) => {
    const options: HealthInputOptions = {
      date: date.toISOString(),
      includeManuallyAdded: false,
    };
    AppleHealthKit.getStepCount(options, (error, results) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(results?.value ?? 0);
    });
  });
}

export function getRestingHeartRate(date: Date): Promise<number | null> {
  return new Promise((resolve, reject) => {
    const options: HealthInputOptions = {
      startDate: startOfDay(date).toISOString(),
      endDate: endOfDay(date).toISOString(),
    };
    AppleHealthKit.getRestingHeartRate(options, (error, results) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(results?.value ?? null);
    });
  });
}

export function getHeartRateVariability(date: Date): Promise<number | null> {
  return new Promise((resolve, reject) => {
    const options: HealthInputOptions = {
      startDate: startOfDay(date).toISOString(),
      endDate: endOfDay(date).toISOString(),
    };
    AppleHealthKit.getHeartRateVariabilitySamples(options, (error, results) => {
      if (error) {
        reject(error);
        return;
      }
      if (!results || results.length === 0) {
        resolve(null);
        return;
      }
      // Average all HRV samples for the day
      const avg = results.reduce((sum: number, r: HealthValue) => sum + r.value, 0) / results.length;
      resolve(Math.round(avg * 10) / 10);
    });
  });
}

export function getActiveEnergy(date: Date): Promise<number> {
  return new Promise((resolve, reject) => {
    const options: HealthInputOptions = {
      startDate: startOfDay(date).toISOString(),
      endDate: endOfDay(date).toISOString(),
    };
    AppleHealthKit.getActiveEnergyBurned(options, (error, results) => {
      if (error) {
        reject(error);
        return;
      }
      if (!results || results.length === 0) {
        resolve(0);
        return;
      }
      const total = results.reduce((sum: number, r: HealthValue) => sum + r.value, 0);
      resolve(Math.round(total));
    });
  });
}

export function getDistance(date: Date): Promise<number> {
  return new Promise((resolve, reject) => {
    const options: HealthInputOptions = {
      date: date.toISOString(),
      includeManuallyAdded: false,
    };
    AppleHealthKit.getDistanceWalkingRunning(options, (error, results) => {
      if (error) {
        reject(error);
        return;
      }
      // Value is in miles, convert to meters
      resolve(Math.round((results?.value ?? 0) * 1609.34));
    });
  });
}

export function getSleepAnalysis(date: Date): Promise<SleepRecord | null> {
  return new Promise((resolve, reject) => {
    const options: HealthInputOptions = {
      startDate: startOfDay(date).toISOString(),
      endDate: endOfDay(date).toISOString(),
    };
    AppleHealthKit.getSleepSamples(options, (error, results) => {
      if (error) {
        reject(error);
        return;
      }
      if (!results || results.length === 0) {
        resolve(null);
        return;
      }

      // Aggregate sleep samples by type
      let deepMinutes = 0;
      let lightMinutes = 0;
      let remMinutes = 0;
      let awakeMinutes = 0;
      let earliestStart = '';
      let latestEnd = '';

      for (const sample of results) {
        const start = new Date(sample.startDate);
        const end = new Date(sample.endDate);
        const durationMin = (end.getTime() - start.getTime()) / 60000;

        if (!earliestStart || sample.startDate < earliestStart) {
          earliestStart = sample.startDate;
        }
        if (!latestEnd || sample.endDate > latestEnd) {
          latestEnd = sample.endDate;
        }

        switch (sample.value) {
          case 'CORE':
          case 'ASLEEP':
            lightMinutes += durationMin;
            break;
          case 'DEEP':
            deepMinutes += durationMin;
            break;
          case 'REM':
            remMinutes += durationMin;
            break;
          case 'AWAKE':
          case 'INBED':
            awakeMinutes += durationMin;
            break;
        }
      }

      const totalSleep = deepMinutes + lightMinutes + remMinutes;

      if (totalSleep === 0) {
        resolve(null);
        return;
      }

      resolve({
        id: uuid(),
        source: 'apple_health',
        sourceId: `ahk_sleep_${format(date, 'yyyy-MM-dd')}`,
        date: format(date, 'yyyy-MM-dd'),
        startTime: earliestStart,
        endTime: latestEnd,
        durationMinutes: Math.round(totalSleep),
        deepMinutes: Math.round(deepMinutes),
        lightMinutes: Math.round(lightMinutes),
        remMinutes: Math.round(remMinutes),
        awakeMinutes: Math.round(awakeMinutes),
        sleepScore: null, // Apple Health doesn't provide a score
        createdAt: new Date().toISOString(),
        syncedAt: null,
      });
    });
  });
}

export async function fetchTodayHealthData(date: Date) {
  const dateStr = format(date, 'yyyy-MM-dd');

  const [steps, restingHR, hrv, activeEnergy, distance, sleep] = await Promise.all([
    getSteps(date),
    getRestingHeartRate(date),
    getHeartRateVariability(date),
    getActiveEnergy(date),
    getDistance(date),
    getSleepAnalysis(date),
  ]);

  const activity: DailyActivity = {
    id: uuid(),
    source: 'apple_health',
    sourceId: `ahk_activity_${dateStr}`,
    date: dateStr,
    steps,
    activeMinutes: 0, // TODO: calculate from workout samples
    caloriesTotal: 0,
    caloriesActive: activeEnergy,
    distanceMeters: distance,
    floorsClimbed: null,
    createdAt: new Date().toISOString(),
    syncedAt: null,
  };

  const heart: DailyHeartMetrics = {
    id: uuid(),
    source: 'apple_health',
    sourceId: `ahk_heart_${dateStr}`,
    date: dateStr,
    restingHR: restingHR,
    avgHR: null,
    maxHR: null,
    hrvAvg: hrv,
    stressScore: null, // Not available from Apple Health
    readinessScore: null, // Not available from Apple Health directly
    readinessHigh: null,
    readinessLow: null,
    createdAt: new Date().toISOString(),
    syncedAt: null,
  };

  return { sleep, activity, heart };
}
