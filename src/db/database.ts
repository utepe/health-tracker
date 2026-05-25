import { open, type DB } from '@op-engineering/op-sqlite';
import { CREATE_TABLES_SQL } from './schema';

let db: DB | null = null;

export function getDatabase(): DB {
  if (!db) {
    db = open({ name: 'health-tracker.db' });
    db.execute(CREATE_TABLES_SQL);
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
