export type DataSource = 'garmin' | 'apple_health' | 'fitbit' | 'combined';

export interface MetricRecord {
  id: string;
  source: DataSource;
  sourceId: string;
  date: string; // YYYY-MM-DD
  createdAt: string; // ISO 8601
  syncedAt: string | null;
}
