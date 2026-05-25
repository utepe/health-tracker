import { create } from 'zustand';

interface ExercisePickerState {
  selectedIds: string[];
  replaceTargetId: string | null; // exerciseId being replaced, set before navigating to picker
  setSelected: (ids: string[]) => void;
  clear: () => void;
  setReplaceTarget: (exerciseId: string) => void;
  clearReplaceTarget: () => void;
}

export const useExercisePickerStore = create<ExercisePickerState>((set) => ({
  selectedIds: [],
  replaceTargetId: null,
  setSelected: (ids) => set({ selectedIds: ids }),
  clear: () => set({ selectedIds: [] }),
  setReplaceTarget: (exerciseId) => set({ replaceTargetId: exerciseId }),
  clearReplaceTarget: () => set({ replaceTargetId: null }),
}));
