export type DataSource = 'garmin' | 'apple_health' | 'fitbit';

export interface MetricRecord {
  id: string;
  source: DataSource;
  sourceId: string;
  date: string; // YYYY-MM-DD
  createdAt: string; // ISO 8601
  syncedAt: string | null;
}
