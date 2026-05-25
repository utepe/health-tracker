export const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS sleep_records (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    source_id TEXT NOT NULL,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    deep_minutes INTEGER NOT NULL DEFAULT 0,
    light_minutes INTEGER NOT NULL DEFAULT 0,
    rem_minutes INTEGER NOT NULL DEFAULT 0,
    awake_minutes INTEGER NOT NULL DEFAULT 0,
    sleep_score INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    synced_at TEXT,
    UNIQUE(source, source_id)
  );

  CREATE INDEX IF NOT EXISTS idx_sleep_date ON sleep_records(date);

  CREATE TABLE IF NOT EXISTS daily_activity (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    source_id TEXT NOT NULL,
    date TEXT NOT NULL,
    steps INTEGER NOT NULL DEFAULT 0,
    active_minutes INTEGER NOT NULL DEFAULT 0,
    calories_total INTEGER NOT NULL DEFAULT 0,
    calories_active INTEGER NOT NULL DEFAULT 0,
    distance_meters REAL NOT NULL DEFAULT 0,
    floors_climbed INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    synced_at TEXT,
    UNIQUE(source, source_id)
  );

  CREATE INDEX IF NOT EXISTS idx_activity_date ON daily_activity(date);

  CREATE TABLE IF NOT EXISTS workout_records (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    source_id TEXT NOT NULL,
    date TEXT NOT NULL,
    activity_type TEXT NOT NULL,
    name TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    calories_burned INTEGER NOT NULL DEFAULT 0,
    avg_heart_rate INTEGER,
    max_heart_rate INTEGER,
    vo2max REAL,
    training_load REAL,
    distance_meters REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    synced_at TEXT,
    UNIQUE(source, source_id)
  );

  CREATE INDEX IF NOT EXISTS idx_workout_date ON workout_records(date);

  CREATE TABLE IF NOT EXISTS daily_heart_metrics (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    source_id TEXT NOT NULL,
    date TEXT NOT NULL,
    resting_hr INTEGER,
    avg_hr INTEGER,
    max_hr INTEGER,
    hrv_avg REAL,
    stress_score INTEGER,
    readiness_score INTEGER,
    readiness_high INTEGER,
    readiness_low INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    synced_at TEXT,
    UNIQUE(source, source_id)
  );

  CREATE INDEX IF NOT EXISTS idx_heart_date ON daily_heart_metrics(date);

  CREATE TABLE IF NOT EXISTS daily_recovery (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    source_id TEXT NOT NULL,
    date TEXT NOT NULL,
    recovery_score INTEGER NOT NULL,
    hrv REAL,
    resting_hr INTEGER,
    sleep_score INTEGER,
    body_battery INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    synced_at TEXT,
    UNIQUE(source, source_id)
  );

  CREATE INDEX IF NOT EXISTS idx_recovery_date ON daily_recovery(date);

  -- Workout Planner Tables

  CREATE TABLE IF NOT EXISTS exercises (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    muscle_group TEXT NOT NULL,
    secondary_muscles TEXT NOT NULL DEFAULT '[]',
    equipment TEXT NOT NULL,
    instructions TEXT NOT NULL DEFAULT '',
    is_custom INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS workout_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    last_performed TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS template_exercises (
    id TEXT PRIMARY KEY,
    template_id TEXT NOT NULL,
    exercise_id TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    target_sets INTEGER NOT NULL DEFAULT 3,
    superset_group TEXT,
    rest_seconds INTEGER NOT NULL DEFAULT 90,
    notes TEXT,
    FOREIGN KEY (template_id) REFERENCES workout_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id)
  );

  CREATE INDEX IF NOT EXISTS idx_template_exercises_template
    ON template_exercises(template_id);

  CREATE TABLE IF NOT EXISTS workout_sessions (
    id TEXT PRIMARY KEY,
    template_id TEXT,
    name TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    avg_heart_rate INTEGER,
    max_heart_rate INTEGER,
    calories_burned INTEGER,
    FOREIGN KEY (template_id) REFERENCES workout_templates(id)
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_status ON workout_sessions(status);
  CREATE INDEX IF NOT EXISTS idx_sessions_start ON workout_sessions(start_time);

  CREATE TABLE IF NOT EXISTS workout_sets (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    exercise_id TEXT NOT NULL,
    set_number INTEGER NOT NULL,
    type TEXT NOT NULL DEFAULT 'working',
    weight REAL,
    reps INTEGER,
    rpe REAL,
    duration_seconds INTEGER,
    is_personal_record INTEGER NOT NULL DEFAULT 0,
    completed_at TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id)
  );

  CREATE INDEX IF NOT EXISTS idx_sets_session ON workout_sets(session_id);
  CREATE INDEX IF NOT EXISTS idx_sets_exercise ON workout_sets(exercise_id);
`;
