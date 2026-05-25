import { getDatabase } from './database';
import {
  Exercise,
  WorkoutTemplate,
  TemplateExercise,
  WorkoutSession,
  WorkoutSet,
} from '../models/workout';

// --- Exercises ---

export function insertExercise(exercise: Exercise): void {
  const db = getDatabase();
  db.execute(
    `INSERT OR IGNORE INTO exercises
      (id, name, muscle_group, secondary_muscles, equipment, instructions, is_custom)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      exercise.id, exercise.name, exercise.muscleGroup,
      JSON.stringify(exercise.secondaryMuscles), exercise.equipment,
      exercise.instructions, exercise.isCustom ? 1 : 0,
    ]
  );
}

export function getAllExercises(): Exercise[] {
  const db = getDatabase();
  const result = db.execute(`SELECT * FROM exercises ORDER BY name ASC`);
  if (!result.rows) return [];
  return result.rows.map(mapExerciseRow);
}

export function getExercisesByMuscleGroup(muscleGroup: string): Exercise[] {
  const db = getDatabase();
  const result = db.execute(
    `SELECT * FROM exercises WHERE muscle_group = ? ORDER BY name ASC`,
    [muscleGroup]
  );
  if (!result.rows) return [];
  return result.rows.map(mapExerciseRow);
}

export function searchExercises(query: string): Exercise[] {
  const db = getDatabase();
  const result = db.execute(
    `SELECT * FROM exercises WHERE name LIKE ? ORDER BY name ASC`,
    [`%${query}%`]
  );
  if (!result.rows) return [];
  return result.rows.map(mapExerciseRow);
}

function mapExerciseRow(row: any): Exercise {
  return {
    id: row.id,
    name: row.name,
    muscleGroup: row.muscle_group,
    secondaryMuscles: JSON.parse(row.secondary_muscles || '[]'),
    equipment: row.equipment,
    instructions: row.instructions,
    isCustom: row.is_custom === 1,
  };
}

// --- Templates ---

export function createTemplate(template: WorkoutTemplate): void {
  const db = getDatabase();
  db.execute(
    `INSERT INTO workout_templates (id, name, last_performed, created_at)
     VALUES (?, ?, ?, ?)`,
    [template.id, template.name, template.lastPerformed, template.createdAt]
  );

  for (const ex of template.exercises) {
    db.execute(
      `INSERT INTO template_exercises
        (id, template_id, exercise_id, sort_order, target_sets, superset_group, rest_seconds, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `${template.id}_${ex.order}`, template.id, ex.exerciseId,
        ex.order, ex.targetSets, ex.supersetGroup, ex.restSeconds, ex.notes,
      ]
    );
  }
}

export function getAllTemplates(): WorkoutTemplate[] {
  const db = getDatabase();
  const result = db.execute(
    `SELECT * FROM workout_templates ORDER BY created_at DESC`
  );
  if (!result.rows) return [];

  return result.rows.map((row) => {
    const exercises = getTemplateExercises(row.id);
    return {
      id: row.id,
      name: row.name,
      lastPerformed: row.last_performed,
      createdAt: row.created_at,
      exercises,
    };
  });
}

export function getTemplateById(id: string): WorkoutTemplate | null {
  const db = getDatabase();
  const result = db.execute(
    `SELECT * FROM workout_templates WHERE id = ?`,
    [id]
  );
  if (!result.rows || result.rows.length === 0) return null;
  const row = result.rows[0];
  const exercises = getTemplateExercises(id);
  return {
    id: row.id,
    name: row.name,
    lastPerformed: row.last_performed,
    createdAt: row.created_at,
    exercises,
  };
}

export function updateTemplate(id: string, name: string, exercises: TemplateExercise[]): void {
  const db = getDatabase();
  db.execute(`UPDATE workout_templates SET name = ? WHERE id = ?`, [name, id]);

  // Replace all template exercises
  db.execute(`DELETE FROM template_exercises WHERE template_id = ?`, [id]);
  for (const ex of exercises) {
    db.execute(
      `INSERT INTO template_exercises
        (id, template_id, exercise_id, sort_order, target_sets, superset_group, rest_seconds, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `${id}_${ex.order}`, id, ex.exerciseId,
        ex.order, ex.targetSets, ex.supersetGroup, ex.restSeconds, ex.notes,
      ]
    );
  }
}

export function deleteTemplate(id: string): void {
  const db = getDatabase();
  db.execute(`DELETE FROM template_exercises WHERE template_id = ?`, [id]);
  db.execute(`DELETE FROM workout_templates WHERE id = ?`, [id]);
}

function getTemplateExercises(templateId: string): TemplateExercise[] {
  const db = getDatabase();
  const result = db.execute(
    `SELECT * FROM template_exercises WHERE template_id = ? ORDER BY sort_order ASC`,
    [templateId]
  );
  if (!result.rows) return [];
  return result.rows.map((row) => ({
    exerciseId: row.exercise_id,
    order: row.sort_order,
    targetSets: row.target_sets,
    supersetGroup: row.superset_group,
    restSeconds: row.rest_seconds,
    notes: row.notes,
  }));
}

// --- Sessions ---

export function createSession(session: WorkoutSession): void {
  const db = getDatabase();
  db.execute(
    `INSERT INTO workout_sessions
      (id, template_id, name, start_time, end_time, status, avg_heart_rate, max_heart_rate, calories_burned)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      session.id, session.templateId, session.name,
      session.startTime, session.endTime, session.status,
      session.avgHeartRate, session.maxHeartRate, session.caloriesBurned,
    ]
  );
}

export function completeSession(id: string, endTime: string): void {
  const db = getDatabase();
  db.execute(
    `UPDATE workout_sessions SET status = 'completed', end_time = ? WHERE id = ?`,
    [endTime, id]
  );
}

export function cancelSession(id: string): void {
  const db = getDatabase();
  db.execute(
    `UPDATE workout_sessions SET status = 'cancelled', end_time = ? WHERE id = ?`,
    [new Date().toISOString(), id]
  );
}

export function getActiveSession(): WorkoutSession | null {
  const db = getDatabase();
  const result = db.execute(
    `SELECT * FROM workout_sessions WHERE status = 'active' LIMIT 1`
  );
  if (!result.rows || result.rows.length === 0) return null;
  return mapSessionRow(result.rows[0]);
}

export function getSessionHistory(limit: number = 20): WorkoutSession[] {
  const db = getDatabase();
  const result = db.execute(
    `SELECT * FROM workout_sessions WHERE status = 'completed'
     ORDER BY start_time DESC LIMIT ?`,
    [limit]
  );
  if (!result.rows) return [];
  return result.rows.map(mapSessionRow);
}

function mapSessionRow(row: any): WorkoutSession {
  return {
    id: row.id,
    templateId: row.template_id,
    name: row.name,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    avgHeartRate: row.avg_heart_rate,
    maxHeartRate: row.max_heart_rate,
    caloriesBurned: row.calories_burned,
  };
}

// --- Sets ---

export function addWorkoutSet(set: WorkoutSet): void {
  const db = getDatabase();
  db.execute(
    `INSERT INTO workout_sets
      (id, session_id, exercise_id, set_number, type, weight, reps, rpe,
       duration_seconds, is_personal_record, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      set.id, set.sessionId, set.exerciseId, set.setNumber,
      set.type, set.weight, set.reps, set.rpe,
      set.durationSeconds, set.isPersonalRecord ? 1 : 0, set.completedAt,
    ]
  );
}

export function getSessionSets(sessionId: string): WorkoutSet[] {
  const db = getDatabase();
  const result = db.execute(
    `SELECT * FROM workout_sets WHERE session_id = ? ORDER BY completed_at ASC`,
    [sessionId]
  );
  if (!result.rows) return [];
  return result.rows.map(mapSetRow);
}

export function getExerciseHistory(exerciseId: string, limit: number = 10): WorkoutSet[] {
  const db = getDatabase();
  const result = db.execute(
    `SELECT ws.* FROM workout_sets ws
     JOIN workout_sessions s ON ws.session_id = s.id
     WHERE ws.exercise_id = ? AND s.status = 'completed'
     ORDER BY ws.completed_at DESC LIMIT ?`,
    [exerciseId, limit]
  );
  if (!result.rows) return [];
  return result.rows.map(mapSetRow);
}

export function getPersonalRecord(exerciseId: string): WorkoutSet | null {
  const db = getDatabase();
  const result = db.execute(
    `SELECT ws.* FROM workout_sets ws
     JOIN workout_sessions s ON ws.session_id = s.id
     WHERE ws.exercise_id = ? AND s.status = 'completed' AND ws.type = 'working'
     ORDER BY ws.weight DESC, ws.reps DESC
     LIMIT 1`,
    [exerciseId]
  );
  if (!result.rows || result.rows.length === 0) return null;
  return mapSetRow(result.rows[0]);
}

function mapSetRow(row: any): WorkoutSet {
  return {
    id: row.id,
    sessionId: row.session_id,
    exerciseId: row.exercise_id,
    setNumber: row.set_number,
    type: row.type,
    weight: row.weight,
    reps: row.reps,
    rpe: row.rpe,
    durationSeconds: row.duration_seconds,
    isPersonalRecord: row.is_personal_record === 1,
    completedAt: row.completed_at,
  };
}
