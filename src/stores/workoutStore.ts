import { create } from 'zustand';
import { CompletedWorkout, Exercise, WorkoutSession, WorkoutSet, WorkoutTemplate, SetType } from '../models/workout';

export interface ActiveExercise {
  exerciseId: string;
  notes: string;
  notesPinned: boolean; // if true, note persists across workouts
  restSeconds: number;
}

// Epley estimated 1RM — normalises any weight/rep combo for fair PR comparison
function calcVolume(weight: number | null, reps: number | null): number {
  const w = weight ?? 0;
  const r = reps ?? 0;
  if (w === 0 || r === 0) return 0;
  return r === 1 ? w : w * (1 + r / 30);
}

interface WorkoutState {
  activeSession: WorkoutSession | null;
  activeExercises: ActiveExercise[];
  activeSets: WorkoutSet[];
  templates: WorkoutTemplate[];
  customExercises: Exercise[];
  completedWorkouts: CompletedWorkout[];
  lastCompletedWorkout: CompletedWorkout | null;
  pinnedNotes: Record<string, string>;
  exerciseHistory: Record<string, { weight: number | null; reps: number | null; type: SetType }[]>;
  // all-time best volume (weight×reps) per exercise, used for PR detection
  allTimeBest: Record<string, number>;
  restTimerEnd: number | null;
  restTimerDuration: number;
  restTimerPaused: boolean;
  restTimerPausedRemaining: number | null;
  restTimerSetId: string | null;

  startSession: (session: WorkoutSession) => void;
  endSession: () => void;
  clearLastCompletedWorkout: () => void;
  addExerciseToSession: (exerciseId: string, restSeconds?: number) => void;
  removeExerciseFromSession: (exerciseId: string) => void;
  replaceExerciseInSession: (oldExerciseId: string, newExerciseId: string) => void;
  checkAndMarkPR: (setId: string) => void;
  updateExerciseNotes: (exerciseId: string, notes: string) => void;
  toggleExerciseNotePin: (exerciseId: string) => void;
  updateExerciseRest: (exerciseId: string, restSeconds: number) => void;
  addSet: (set: WorkoutSet) => void;
  insertSetAtBeginning: (set: WorkoutSet) => void;
  updateSet: (id: string, updates: Partial<WorkoutSet>) => void;
  removeSet: (id: string) => void;
  setTemplates: (templates: WorkoutTemplate[]) => void;
  addCustomExercise: (exercise: Exercise) => void;
  updateCustomExercise: (id: string, updates: Partial<Omit<Exercise, 'id' | 'isCustom'>>) => void;
  startRestTimer: (seconds: number, setId?: string) => void;
  adjustRestTimer: (deltaSeconds: number) => void;
  pauseRestTimer: () => void;
  resumeRestTimer: () => void;
  resetRestTimer: () => void;
  clearRestTimer: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  activeSession: null,
  activeExercises: [],
  activeSets: [],
  templates: [],
  customExercises: [],
  completedWorkouts: [],
  lastCompletedWorkout: null,
  pinnedNotes: {},
  allTimeBest: {},
  exerciseHistory: {
    // Pre-seeded history so the "previous" column shows real data on first launch
    'ex_bench_press': [
      { weight: 80, reps: 5, type: 'working' },
      { weight: 80, reps: 5, type: 'working' },
      { weight: 80, reps: 4, type: 'working' },
    ],
    'ex_barbell_row': [
      { weight: 70, reps: 6, type: 'working' },
      { weight: 70, reps: 6, type: 'working' },
      { weight: 70, reps: 5, type: 'working' },
    ],
    'ex_squat': [
      { weight: 100, reps: 5, type: 'working' },
      { weight: 100, reps: 5, type: 'working' },
      { weight: 100, reps: 4, type: 'working' },
    ],
    'ex_deadlift': [
      { weight: 120, reps: 5, type: 'working' },
      { weight: 120, reps: 3, type: 'working' },
    ],
    'ex_overhead_press': [
      { weight: 55, reps: 6, type: 'working' },
      { weight: 55, reps: 6, type: 'working' },
      { weight: 55, reps: 5, type: 'working' },
    ],
    'ex_pull_up': [
      { weight: null, reps: 10, type: 'working' },
      { weight: null, reps: 8, type: 'working' },
      { weight: null, reps: 7, type: 'working' },
    ],
    'ex_dumbbell_curl': [
      { weight: 14, reps: 10, type: 'working' },
      { weight: 14, reps: 10, type: 'working' },
      { weight: 14, reps: 8, type: 'working' },
    ],
    'ex_tricep_pushdown': [
      { weight: 35, reps: 12, type: 'working' },
      { weight: 35, reps: 12, type: 'working' },
      { weight: 35, reps: 10, type: 'working' },
    ],
    'ex_lateral_raise': [
      { weight: 10, reps: 15, type: 'working' },
      { weight: 10, reps: 15, type: 'working' },
      { weight: 10, reps: 12, type: 'working' },
    ],
    'ex_leg_press': [
      { weight: 160, reps: 10, type: 'working' },
      { weight: 160, reps: 10, type: 'working' },
      { weight: 160, reps: 8, type: 'working' },
    ],
  },
  restTimerEnd: null,
  restTimerDuration: 120,
  restTimerPaused: false,
  restTimerPausedRemaining: null,
  restTimerSetId: null,

  startSession: (session) => set({ activeSession: session, activeExercises: [], activeSets: [] }),
  endSession: () => {
    const state = get();
    if (!state.activeSession) return null;

    const endTime = new Date().toISOString();
    const durationSeconds = Math.floor(
      (new Date(endTime).getTime() - new Date(state.activeSession.startTime).getTime()) / 1000
    );

    // PR flags are already set on each set by checkAndMarkPR during the workout.
    // Re-running detection here would compare against the already-updated allTimeBest
    // and incorrectly clear flags. Just use what checkAndMarkPR recorded.
    const completedSets = state.activeSets.filter((s) => s.completedAt !== '');
    const newHistory = { ...state.exerciseHistory };

    // Update exercise history (last session's sets per exercise)
    const exerciseIds = new Set(completedSets.map((s) => s.exerciseId));
    exerciseIds.forEach((exerciseId) => {
      const sets = completedSets
        .filter((s) => s.exerciseId === exerciseId)
        .sort((a, b) => a.setNumber - b.setNumber)
        .map((s) => ({ weight: s.weight, reps: s.reps, type: s.type }));
      if (sets.length > 0) newHistory[exerciseId] = sets;
    });

    // Build completed workout record
    const exerciseOrder = state.activeExercises.map((e) => e.exerciseId);
    const totalVolumeKg = completedSets.reduce((acc, s) => acc + calcVolume(s.weight, s.reps), 0);
    const prCount = completedSets.filter((s) => s.isPersonalRecord).length;

    const completed: CompletedWorkout = {
      id: state.activeSession.id,
      name: state.activeSession.name,
      templateId: state.activeSession.templateId,
      startTime: state.activeSession.startTime,
      endTime,
      durationSeconds,
      totalVolumeKg,
      prCount,
      exercises: exerciseOrder.map((exerciseId) => ({
        exerciseId,
        sets: completedSets.filter((s) => s.exerciseId === exerciseId),
      })),
    };

    set({
      activeSession: null,
      activeExercises: [],
      activeSets: [],
      restTimerEnd: null,
      exerciseHistory: newHistory,
      completedWorkouts: [completed, ...state.completedWorkouts],
      lastCompletedWorkout: completed,
    });
  },

  clearLastCompletedWorkout: () => set({ lastCompletedWorkout: null }),

  addExerciseToSession: (exerciseId, restSeconds = 120) =>
    set((state) => {
      const pinnedNote = state.pinnedNotes[exerciseId] ?? '';
      const sessionId = state.activeSession?.id ?? '';
      const history = state.exerciseHistory[exerciseId];

      // Create sets from history or default to 1 empty set
      let newSets: WorkoutSet[];
      if (history && history.length > 0) {
        newSets = history.map((prev, i) => ({
          id: `set_${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${i}`,
          sessionId,
          exerciseId,
          setNumber: i + 1,
          type: prev.type,
          weight: prev.weight,
          reps: prev.reps,
          rpe: null,
          durationSeconds: null,
          restSeconds: null,
          isPersonalRecord: false,
          completedAt: '',
        }));
      } else {
        newSets = [{
          id: `set_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          sessionId,
          exerciseId,
          setNumber: 1,
          type: 'working' as SetType,
          weight: null,
          reps: null,
          rpe: null,
          durationSeconds: null,
          restSeconds: null,
          isPersonalRecord: false,
          completedAt: '',
        }];
      }

      return {
        activeExercises: [...state.activeExercises, {
          exerciseId,
          notes: pinnedNote,
          notesPinned: pinnedNote.length > 0,
          restSeconds,
        }],
        activeSets: [...state.activeSets, ...newSets],
      };
    }),

  removeExerciseFromSession: (exerciseId) =>
    set((state) => ({
      activeExercises: state.activeExercises.filter((e) => e.exerciseId !== exerciseId),
      activeSets: state.activeSets.filter((s) => s.exerciseId !== exerciseId),
    })),

  replaceExerciseInSession: (oldExerciseId, newExerciseId) =>
    set((state) => {
      const oldEntry = state.activeExercises.find((e) => e.exerciseId === oldExerciseId);
      const pinnedNote = state.pinnedNotes[newExerciseId] ?? '';
      const history = state.exerciseHistory[newExerciseId];
      const sessionId = state.activeSession?.id ?? '';

      let newSets: WorkoutSet[];
      if (history && history.length > 0) {
        newSets = history.map((prev, i) => ({
          id: `set_${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${i}`,
          sessionId,
          exerciseId: newExerciseId,
          setNumber: i + 1,
          type: prev.type,
          weight: prev.weight,
          reps: prev.reps,
          rpe: null,
          durationSeconds: null,
          restSeconds: null,
          isPersonalRecord: false,
          completedAt: '',
        }));
      } else {
        newSets = [{
          id: `set_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          sessionId,
          exerciseId: newExerciseId,
          setNumber: 1,
          type: 'working' as SetType,
          weight: null,
          reps: null,
          rpe: null,
          durationSeconds: null,
          restSeconds: null,
          isPersonalRecord: false,
          completedAt: '',
        }];
      }

      return {
        activeExercises: state.activeExercises.map((e) =>
          e.exerciseId === oldExerciseId
            ? { ...e, exerciseId: newExerciseId, notes: pinnedNote, notesPinned: pinnedNote.length > 0 }
            : e
        ),
        activeSets: [
          ...state.activeSets.filter((s) => s.exerciseId !== oldExerciseId),
          ...newSets,
        ],
      };
    }),

  addCustomExercise: (exercise) =>
    set((state) => ({ customExercises: [...state.customExercises, exercise] })),
  updateCustomExercise: (id, updates) =>
    set((state) => ({
      customExercises: state.customExercises.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    })),

  updateExerciseNotes: (exerciseId, notes) =>
    set((state) => {
      const exercise = state.activeExercises.find((e) => e.exerciseId === exerciseId);
      const isPinned = exercise?.notesPinned ?? false;
      return {
        activeExercises: state.activeExercises.map((e) =>
          e.exerciseId === exerciseId ? { ...e, notes } : e
        ),
        // If pinned, update the persistent note as user types
        pinnedNotes: isPinned
          ? { ...state.pinnedNotes, [exerciseId]: notes }
          : state.pinnedNotes,
      };
    }),

  toggleExerciseNotePin: (exerciseId) =>
    set((state) => {
      const exercise = state.activeExercises.find((e) => e.exerciseId === exerciseId);
      if (!exercise) return {};
      const newPinned = !exercise.notesPinned;
      const updatedPinnedNotes = { ...state.pinnedNotes };
      if (newPinned) {
        // Pin: save current note to persistent storage
        updatedPinnedNotes[exerciseId] = exercise.notes;
      } else {
        // Unpin: remove from persistent storage
        delete updatedPinnedNotes[exerciseId];
      }
      return {
        activeExercises: state.activeExercises.map((e) =>
          e.exerciseId === exerciseId ? { ...e, notesPinned: newPinned } : e
        ),
        pinnedNotes: updatedPinnedNotes,
      };
    }),

  updateExerciseRest: (exerciseId, restSeconds) =>
    set((state) => ({
      activeExercises: state.activeExercises.map((e) =>
        e.exerciseId === exerciseId ? { ...e, restSeconds } : e
      ),
    })),

  checkAndMarkPR: (setId) => set((state) => {
    const s = state.activeSets.find((s) => s.id === setId);
    if (!s || s.type !== 'working') return {};
    const vol = calcVolume(s.weight, s.reps);
    const best = state.allTimeBest[s.exerciseId] ?? 0;
    if (vol > 0 && vol > best) {
      return {
        activeSets: state.activeSets.map((x) => x.id === setId ? { ...x, isPersonalRecord: true } : x),
        allTimeBest: { ...state.allTimeBest, [s.exerciseId]: vol },
      };
    }
    return { activeSets: state.activeSets.map((x) => x.id === setId ? { ...x, isPersonalRecord: false } : x) };
  }),

  addSet: (newSet) => set((state) => ({ activeSets: [...state.activeSets, newSet] })),
  insertSetAtBeginning: (newSet) => set((state) => {
    // Insert after the last warmup set but before working sets for this exercise
    const updated = [...state.activeSets];
    const exerciseSets = updated
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => s.exerciseId === newSet.exerciseId);

    if (exerciseSets.length === 0) {
      return { activeSets: [...updated, newSet] };
    }

    // Find the index after the last warmup set for this exercise
    const lastWarmupEntry = [...exerciseSets].reverse().find(({ s }) => s.type === 'warmup');
    const insertIdx = lastWarmupEntry
      ? lastWarmupEntry.i + 1
      : exerciseSets[0].i; // no warmups yet, insert before first set

    updated.splice(insertIdx, 0, newSet);
    return { activeSets: updated };
  }),
  updateSet: (id, updates) =>
    set((state) => ({
      activeSets: state.activeSets.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })),
  removeSet: (id) =>
    set((state) => ({ activeSets: state.activeSets.filter((s) => s.id !== id) })),
  setTemplates: (templates) => set({ templates }),
  startRestTimer: (seconds, setId) => set({
    restTimerEnd: Date.now() + seconds * 1000,
    restTimerDuration: seconds,
    restTimerPaused: false,
    restTimerPausedRemaining: null,
    restTimerSetId: setId ?? null,
  }),
  adjustRestTimer: (deltaSeconds) => set((state) => {
    if (state.restTimerPaused && state.restTimerPausedRemaining !== null) {
      const newRemaining = Math.max(0, state.restTimerPausedRemaining + deltaSeconds * 1000);
      return { restTimerPausedRemaining: newRemaining };
    }
    if (state.restTimerEnd) {
      return { restTimerEnd: state.restTimerEnd + deltaSeconds * 1000 };
    }
    return {};
  }),
  pauseRestTimer: () => set((state) => {
    if (!state.restTimerEnd || state.restTimerPaused) return {};
    const remaining = state.restTimerEnd - Date.now();
    return { restTimerPaused: true, restTimerPausedRemaining: Math.max(0, remaining), restTimerEnd: null };
  }),
  resumeRestTimer: () => set((state) => {
    if (!state.restTimerPaused || state.restTimerPausedRemaining === null) return {};
    return {
      restTimerPaused: false,
      restTimerEnd: Date.now() + state.restTimerPausedRemaining,
      restTimerPausedRemaining: null,
    };
  }),
  resetRestTimer: () => set((state) => ({
    restTimerEnd: Date.now() + state.restTimerDuration * 1000,
    restTimerPaused: false,
    restTimerPausedRemaining: null,
  })),
  clearRestTimer: () => set({ restTimerEnd: null, restTimerPaused: false, restTimerPausedRemaining: null, restTimerSetId: null }),
}));
