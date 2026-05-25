import { getDatabase } from './database';
import { SleepRecord } from '../models/sleep';
import { DailyActivity } from '../models/activity';
import { DailyHeartMetrics } from '../models/heart';
import { DailyRecovery } from '../models/recovery';

// --- Sleep ---

export function upsertSleepRecord(record: SleepRecord): void {
  const db = getDatabase();
  db.execute(
    `INSERT OR REPLACE INTO sleep_records
      (id, source, source_id, date, start_time, end_time, duration_minutes,
       deep_minutes, light_minutes, rem_minutes, awake_minutes, sleep_score, created_at, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      record.id, record.source, record.sourceId, record.date,
      record.startTime, record.endTime, record.durationMinutes,
      record.deepMinutes, record.lightMinutes, record.remMinutes,
      record.awakeMinutes, record.sleepScore, record.createdAt, record.syncedAt,
    ]
  );
}

export function getSleepByDate(date: string): SleepRecord | null {
  const db = getDatabase();
  const result = db.execute(
    `SELECT * FROM sleep_records WHERE date = ? ORDER BY
      CASE source WHEN 'garmin' THEN 3 WHEN 'fitbit' THEN 2 WHEN 'apple_health' THEN 1 END DESC
     LIMIT 1`,
    [date]
  );
  if (!result.rows || result.rows.length === 0) return null;
  return mapSleepRow(result.rows[0]);
}

export function getSleepHistory(days: number): SleepRecord[] {
  const db = getDatabase();
  const result = db.execute(
    `SELECT * FROM sleep_records
     WHERE date >= date('now', '-' || ? || ' days')
     GROUP BY date
     HAVING source = MAX(CASE source WHEN 'garmin' THEN 3 WHEN 'fitbit' THEN 2 WHEN 'apple_health' THEN 1 END)
     ORDER BY date ASC`,
    [days]
  );
  if (!result.rows) return [];
  return result.rows.map(mapSleepRow);
}

function mapSleepRow(row: any): SleepRecord {
  return {
    id: row.id,
    source: row.source,
    sourceId: row.source_id,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    durationMinutes: row.duration_minutes,
    deepMinutes: row.deep_minutes,
    lightMinutes: row.light_minutes,
    remMinutes: row.rem_minutes,
    awakeMinutes: row.awake_minutes,
    sleepScore: row.sleep_score,
    createdAt: row.created_at,
    syncedAt: row.synced_at,
  };
}

// --- Activity ---

export function upsertDailyActivity(record: DailyActivity): void {
  const db = getDatabase();
  db.execute(
    `INSERT OR REPLACE INTO daily_activity
      (id, source, source_id, date, steps, active_minutes, calories_total,
       calories_active, distance_meters, floors_climbed, created_at, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      record.id, record.source, record.sourceId, record.date,
      record.steps, record.activeMinutes, record.caloriesTotal,
      record.caloriesActive, record.distanceMeters, record.floorsClimbed,
      record.createdAt, record.syncedAt,
    ]
  );
}

export function getActivityByDate(date: string): DailyActivity | null {
  const db = getDatabase();
  const result = db.execute(
    `SELECT * FROM daily_activity WHERE date = ? ORDER BY
      CASE source WHEN 'apple_health' THEN 3 WHEN 'garmin' THEN 2 WHEN 'fitbit' THEN 1 END DESC
     LIMIT 1`,
    [date]
  );
  if (!result.rows || result.rows.length === 0) return null;
  return mapActivityRow(result.rows[0]);
}

export function getActivityHistory(days: number): DailyActivity[] {
  const db = getDatabase();
  const result = db.execute(
    `SELECT * FROM daily_activity
     WHERE date >= date('now', '-' || ? || ' days')
     GROUP BY date
     HAVING source = MAX(CASE source WHEN 'apple_health' THEN 3 WHEN 'garmin' THEN 2 WHEN 'fitbit' THEN 1 END)
     ORDER BY date ASC`,
    [days]
  );
  if (!result.rows) return [];
  return result.rows.map(mapActivityRow);
}

function mapActivityRow(row: any): DailyActivity {
  return {
    id: row.id,
    source: row.source,
    sourceId: row.source_id,
    date: row.date,
    steps: row.steps,
    activeMinutes: row.active_minutes,
    caloriesTotal: row.calories_total,
    caloriesActive: row.calories_active,
    distanceMeters: row.distance_meters,
    floorsClimbed: row.floors_climbed,
    createdAt: row.created_at,
    syncedAt: row.synced_at,
  };
}

// --- Heart Metrics ---

export function upsertDailyHeartMetrics(record: DailyHeartMetrics): void {
  const db = getDatabase();
  db.execute(
    `INSERT OR REPLACE INTO daily_heart_metrics
      (id, source, source_id, date, resting_hr, avg_hr, max_hr,
       hrv_avg, stress_score, readiness_score, readiness_high, readiness_low, created_at, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      record.id, record.source, record.sourceId, record.date,
      record.restingHR, record.avgHR, record.maxHR,
      record.hrvAvg, record.stressScore, record.readinessScore,
      record.readinessHigh, record.readinessLow, record.createdAt, record.syncedAt,
    ]
  );
}

export function getHeartByDate(date: string): DailyHeartMetrics | null {
  const db = getDatabase();
  const result = db.execute(
    `SELECT * FROM daily_heart_metrics WHERE date = ? ORDER BY
      CASE source WHEN 'garmin' THEN 3 WHEN 'fitbit' THEN 2 WHEN 'apple_health' THEN 1 END DESC
     LIMIT 1`,
    [date]
  );
  if (!result.rows || result.rows.length === 0) return null;
  return mapHeartRow(result.rows[0]);
}

export function getHeartHistory(days: number): DailyHeartMetrics[] {
  const db = getDatabase();
  const result = db.execute(
    `SELECT * FROM daily_heart_metrics
     WHERE date >= date('now', '-' || ? || ' days')
     GROUP BY date
     HAVING source = MAX(CASE source WHEN 'garmin' THEN 3 WHEN 'fitbit' THEN 2 WHEN 'apple_health' THEN 1 END)
     ORDER BY date ASC`,
    [days]
  );
  if (!result.rows) return [];
  return result.rows.map(mapHeartRow);
}

function mapHeartRow(row: any): DailyHeartMetrics {
  return {
    id: row.id,
    source: row.source,
    sourceId: row.source_id,
    date: row.date,
    restingHR: row.resting_hr,
    avgHR: row.avg_hr,
    maxHR: row.max_hr,
    hrvAvg: row.hrv_avg,
    stressScore: row.stress_score,
    readinessScore: row.readiness_score,
    readinessHigh: row.readiness_high,
    readinessLow: row.readiness_low,
    createdAt: row.created_at,
    syncedAt: row.synced_at,
  };
}

// --- Recovery ---

export function upsertDailyRecovery(record: DailyRecovery): void {
  const db = getDatabase();
  db.execute(
    `INSERT OR REPLACE INTO daily_recovery
      (id, source, source_id, date, recovery_score, hrv, resting_hr,
       sleep_score, body_battery, created_at, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      record.id, record.source, record.sourceId, record.date,
      record.recoveryScore, record.hrv, record.restingHR,
      record.sleepScore, record.bodyBattery, record.createdAt, record.syncedAt,
    ]
  );
}

export function getRecoveryByDate(date: string): DailyRecovery | null {
  const db = getDatabase();
  const result = db.execute(
    `SELECT * FROM daily_recovery WHERE date = ? ORDER BY created_at DESC LIMIT 1`,
    [date]
  );
  if (!result.rows || result.rows.length === 0) return null;
  return mapRecoveryRow(result.rows[0]);
}

function mapRecoveryRow(row: any): DailyRecovery {
  return {
    id: row.id,
    source: row.source,
    sourceId: row.source_id,
    date: row.date,
    recoveryScore: row.recovery_score,
    hrv: row.hrv,
    restingHR: row.resting_hr,
    sleepScore: row.sleep_score,
    bodyBattery: row.body_battery,
    createdAt: row.created_at,
    syncedAt: row.synced_at,
  };
}
