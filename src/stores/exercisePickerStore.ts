import { create } from 'zustand';

interface ExercisePickerState {
  selectedIds: string[];
  setSelected: (ids: string[]) => void;
  clear: () => void;
}

export const useExercisePickerStore = create<ExercisePickerState>((set) => ({
  selectedIds: [],
  setSelected: (ids) => set({ selectedIds: ids }),
  clear: () => set({ selectedIds: [] }),
}));
