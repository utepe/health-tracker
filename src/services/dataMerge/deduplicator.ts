import { MetricRecord } from '../../models/common';

/**
 * Check if two workout records overlap in time (within a tolerance window).
 * Used to detect the same workout recorded by multiple sources.
 */
export function isTimeOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
  toleranceMinutes: number = 5
): boolean {
  const tolerance = toleranceMinutes * 60 * 1000;
  const aStart = new Date(startA).getTime() - tolerance;
  const aEnd = new Date(endA).getTime() + tolerance;
  const bStart = new Date(startB).getTime();
  const bEnd = new Date(endB).getTime();

  return aStart < bEnd && bStart < aEnd;
}

/**
 * Group records by date, returning a Map of date -> records
 */
export function groupByDate<T extends MetricRecord>(records: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const record of records) {
    const existing = grouped.get(record.date) ?? [];
    existing.push(record);
    grouped.set(record.date, existing);
  }
  return grouped;
}
