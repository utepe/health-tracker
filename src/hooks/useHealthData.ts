import { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { useHealthStore } from '../stores/healthStore';
import { useSettingsStore } from '../stores/settingsStore';
import { fetchTodayHealthData, initHealthKit } from '../services/appleHealth/healthKit';

export function useHealthData() {
  const { setTodaySleep, setTodayActivity, setTodayHeart, setIsLoading, setLastSyncTime } =
    useHealthStore();
  const { isHealthKitConnected, setHealthKitConnected } = useSettingsStore();

  const connectHealthKit = useCallback(async () => {
    if (Platform.OS !== 'ios') return;

    try {
      await initHealthKit();
      setHealthKitConnected(true);
    } catch (error) {
      console.error('Failed to connect HealthKit:', error);
      setHealthKitConnected(false);
    }
  }, [setHealthKitConnected]);

  const refreshData = useCallback(async () => {
    if (Platform.OS !== 'ios' || !isHealthKitConnected) return;

    setIsLoading(true);
    try {
      const today = new Date();
      const { sleep, activity, heart } = await fetchTodayHealthData(today);

      setTodaySleep(sleep);
      setTodayActivity(activity);
      setTodayHeart(heart);
      setLastSyncTime(new Date().toISOString());
    } catch (error) {
      console.error('Failed to fetch health data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isHealthKitConnected, setTodaySleep, setTodayActivity, setTodayHeart, setIsLoading, setLastSyncTime]);

  useEffect(() => {
    if (isHealthKitConnected) {
      refreshData();
    }
  }, [isHealthKitConnected, refreshData]);

  return {
    connectHealthKit,
    refreshData,
    isConnected: isHealthKitConnected,
  };
}
