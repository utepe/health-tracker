import { create } from 'zustand';
import { SleepRecord } from '../models/sleep';
import { DailyActivity, WorkoutRecord } from '../models/activity';
import { DailyHeartMetrics } from '../models/heart';
import { DailyRecovery } from '../models/recovery';
import { mockSleep, mockActivity, mockHeart, mockRecovery, mockWorkoutRecords, weeklyMockData } from '../data/mockData';
import { Platform } from 'react-native';

// Use mock data on web for development
const useMock = Platform.OS === 'web';

interface HealthState {
  todaySleep: SleepRecord | null;
  todayActivity: DailyActivity | null;
  todayHeart: DailyHeartMetrics | null;
  todayRecovery: DailyRecovery | null;
  sleepHistory: SleepRecord[];
  activityHistory: DailyActivity[];
  heartHistory: DailyHeartMetrics[];
  workoutRecords: WorkoutRecord[];
  isLoading: boolean;
  lastSyncTime: string | null;

  setTodaySleep: (sleep: SleepRecord | null) => void;
  setTodayActivity: (activity: DailyActivity | null) => void;
  setTodayHeart: (heart: DailyHeartMetrics | null) => void;
  setTodayRecovery: (recovery: DailyRecovery | null) => void;
  setSleepHistory: (history: SleepRecord[]) => void;
  setActivityHistory: (history: DailyActivity[]) => void;
  setHeartHistory: (history: DailyHeartMetrics[]) => void;
  setWorkoutRecords: (records: WorkoutRecord[]) => void;
  addWorkoutRecord: (record: WorkoutRecord) => void;
  deleteWorkoutRecord: (id: string) => void;
  renameWorkoutRecord: (id: string, name: string) => void;
  setIsLoading: (loading: boolean) => void;
  setLastSyncTime: (time: string) => void;
}

export const useHealthStore = create<HealthState>((set) => ({
  todaySleep: useMock ? mockSleep : null,
  todayActivity: useMock ? mockActivity : null,
  todayHeart: useMock ? mockHeart : null,
  todayRecovery: useMock ? mockRecovery : null,
  sleepHistory: useMock ? weeklyMockData.sleepHistory : [],
  activityHistory: useMock ? weeklyMockData.activityHistory : [],
  heartHistory: useMock ? weeklyMockData.heartHistory : [],
  workoutRecords: useMock ? mockWorkoutRecords : [],
  isLoading: false,
  lastSyncTime: useMock ? new Date().toISOString() : null,

  setTodaySleep: (sleep) => set({ todaySleep: sleep }),
  setTodayActivity: (activity) => set({ todayActivity: activity }),
  setTodayHeart: (heart) => set({ todayHeart: heart }),
  setTodayRecovery: (recovery) => set({ todayRecovery: recovery }),
  setSleepHistory: (history) => set({ sleepHistory: history }),
  setActivityHistory: (history) => set({ activityHistory: history }),
  setHeartHistory: (history) => set({ heartHistory: history }),
  setWorkoutRecords: (records) => set({ workoutRecords: records }),
  addWorkoutRecord: (record) => set((state) => ({ workoutRecords: [record, ...state.workoutRecords] })),
  deleteWorkoutRecord: (id) => set((state) => ({ workoutRecords: state.workoutRecords.filter((r) => r.id !== id) })),
  renameWorkoutRecord: (id, name) => set((state) => ({
    workoutRecords: state.workoutRecords.map((r) => r.id === id ? { ...r, name } : r),
  })),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setLastSyncTime: (time) => set({ lastSyncTime: time }),
}));
