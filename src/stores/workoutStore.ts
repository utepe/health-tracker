import { create } from 'zustand';
import { WorkoutSession, WorkoutSet, WorkoutTemplate, SetType } from '../models/workout';

export interface ActiveExercise {
  exerciseId: string;
  notes: string;
  notesPinned: boolean; // if true, note persists across workouts
  restSeconds: number;
}

interface WorkoutState {
  activeSession: WorkoutSession | null;
  activeExercises: ActiveExercise[];
  activeSets: WorkoutSet[];
  templates: WorkoutTemplate[];
  pinnedNotes: Record<string, string>; // exerciseId -> persistent note
  exerciseHistory: Record<string, { weight: number | null; reps: number | null; type: SetType }[]>; // exerciseId -> last session's sets
  restTimerEnd: number | null;
  restTimerDuration: number; // total rest in seconds
  restTimerPaused: boolean;
  restTimerPausedRemaining: number | null; // ms remaining when paused
  restTimerSetId: string | null; // which set triggered the rest timer

  startSession: (session: WorkoutSession) => void;
  endSession: () => void;
  addExerciseToSession: (exerciseId: string, restSeconds?: number) => void;
  removeExerciseFromSession: (exerciseId: string) => void;
  updateExerciseNotes: (exerciseId: string, notes: string) => void;
  toggleExerciseNotePin: (exerciseId: string) => void;
  updateExerciseRest: (exerciseId: string, restSeconds: number) => void;
  addSet: (set: WorkoutSet) => void;
  insertSetAtBeginning: (set: WorkoutSet) => void;
  updateSet: (id: string, updates: Partial<WorkoutSet>) => void;
  removeSet: (id: string) => void;
  setTemplates: (templates: WorkoutTemplate[]) => void;
  startRestTimer: (seconds: number, setId?: string) => void;
  adjustRestTimer: (deltaSeconds: number) => void;
  pauseRestTimer: () => void;
  resumeRestTimer: () => void;
  resetRestTimer: () => void;
  clearRestTimer: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set) => ({
  activeSession: null,
  activeExercises: [],
  activeSets: [],
  templates: [],
  pinnedNotes: {},
  exerciseHistory: {},
  restTimerEnd: null,
  restTimerDuration: 120,
  restTimerPaused: false,
  restTimerPausedRemaining: null,
  restTimerSetId: null,

  startSession: (session) => set({ activeSession: session, activeExercises: [], activeSets: [] }),
  endSession: () => set((state) => {
    // Save completed sets into exercise history for future reference
    const newHistory = { ...state.exerciseHistory };
    const exerciseIds = new Set(state.activeSets.map((s) => s.exerciseId));
    exerciseIds.forEach((exerciseId) => {
      const sets = state.activeSets
        .filter((s) => s.exerciseId === exerciseId && s.completedAt !== '')
        .sort((a, b) => a.setNumber - b.setNumber)
        .map((s) => ({ weight: s.weight, reps: s.reps, type: s.type }));
      if (sets.length > 0) {
        newHistory[exerciseId] = sets;
      }
    });
    return {
      activeSession: null,
      activeExercises: [],
      activeSets: [],
      restTimerEnd: null,
      exerciseHistory: newHistory,
    };
  }),

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
