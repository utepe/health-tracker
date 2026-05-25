import { DataSource } from '../../models/common';

type MetricType = 'sleep' | 'steps' | 'heart' | 'readiness' | 'stress' | 'trainingLoad' | 'workout';

// Higher number = higher priority
const SOURCE_PRIORITY: Record<MetricType, Record<DataSource, number>> = {
  sleep: { garmin: 3, fitbit: 2, apple_health: 1 },
  steps: { apple_health: 3, garmin: 2, fitbit: 1 },
  heart: { garmin: 3, apple_health: 2, fitbit: 1 },
  readiness: { garmin: 3, fitbit: 2, apple_health: 1 },
  stress: { garmin: 3, apple_health: 0, fitbit: 0 },
  trainingLoad: { garmin: 3, apple_health: 0, fitbit: 0 },
  workout: { garmin: 3, apple_health: 2, fitbit: 1 },
};

export function getSourcePriority(metricType: MetricType, source: DataSource): number {
  return SOURCE_PRIORITY[metricType]?.[source] ?? 0;
}

export function pickBestSource<T extends { source: DataSource; createdAt: string }>(
  records: T[],
  metricType: MetricType
): T | null {
  if (records.length === 0) return null;

  return records.sort((a, b) => {
    const priorityDiff = getSourcePriority(metricType, b.source) - getSourcePriority(metricType, a.source);
    if (priorityDiff !== 0) return priorityDiff;
    // Same priority: prefer most recent
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  })[0];
}
