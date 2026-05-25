import { create } from 'zustand';

interface SettingsState {
  isHealthKitConnected: boolean;
  isGarminConnected: boolean;
  isGoogleDriveConnected: boolean;
  stepGoal: number;
  sleepGoalMinutes: number;
  activeMinuteGoal: number;
  weightUnit: 'kg' | 'lbs';

  setHealthKitConnected: (connected: boolean) => void;
  setGarminConnected: (connected: boolean) => void;
  setGoogleDriveConnected: (connected: boolean) => void;
  setStepGoal: (goal: number) => void;
  setSleepGoalMinutes: (minutes: number) => void;
  setActiveMinuteGoal: (minutes: number) => void;
  setWeightUnit: (unit: 'kg' | 'lbs') => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  isHealthKitConnected: false,
  isGarminConnected: false,
  isGoogleDriveConnected: false,
  stepGoal: 10000,
  sleepGoalMinutes: 480,
  activeMinuteGoal: 30,
  weightUnit: 'kg',

  setHealthKitConnected: (connected) => set({ isHealthKitConnected: connected }),
  setGarminConnected: (connected) => set({ isGarminConnected: connected }),
  setGoogleDriveConnected: (connected) => set({ isGoogleDriveConnected: connected }),
  setStepGoal: (goal) => set({ stepGoal: goal }),
  setSleepGoalMinutes: (minutes) => set({ sleepGoalMinutes: minutes }),
  setActiveMinuteGoal: (minutes) => set({ activeMinuteGoal: minutes }),
  setWeightUnit: (unit) => set({ weightUnit: unit }),
}));
