import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, parseISO } from 'date-fns';
import { Card } from '../../src/components/ui/Card';
import { ProgressBar } from '../../src/components/ui/ProgressBar';
import { SourceBadge } from '../../src/components/ui/SourceBadge';
import { useHealthStore } from '../../src/stores/healthStore';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';
import { Ionicons } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { WorkoutType } from '../../src/models/activity';

const IONICONS_ICONS: Partial<Record<WorkoutType, keyof typeof Ionicons.glyphMap>> = {
  cycle: 'bicycle-outline',
  swim: 'water-outline',
  walk: 'footsteps-outline',
  hike: 'trail-sign-outline',
  strength: 'barbell-outline',
  yoga: 'body-outline',
  cardio: 'heart-outline',
  other: 'fitness-outline',
};

function WorkoutIcon({ type, color }: { type: WorkoutType; color: string }) {
  if (type === 'run') return <MaterialIcons name="directions-run" size={18} color={color} />;
  return <Ionicons name={IONICONS_ICONS[type] ?? 'fitness-outline'} size={18} color={color} />;
}

const WORKOUT_COLORS: Record<WorkoutType, string> = {
  run: colors.activity,
  cycle: colors.info,
  swim: '#60D5FA',
  walk: colors.steps,
  hike: '#A3E635',
  strength: colors.stress,
  yoga: colors.sleep,
  cardio: colors.heart,
  other: colors.textSecondary,
};

export default function ActivityScreen() {
  const { todayActivity, activityHistory, workoutRecords } = useHealthStore();
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayWorkouts = workoutRecords.filter((w) => w.date === today);
  const workoutActiveMinutes = todayWorkouts.reduce((sum, w) => sum + w.durationMinutes, 0);
  const totalActiveMinutes = (todayActivity?.activeMinutes ?? 0) + workoutActiveMinutes;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Activity</Text>
        <Text style={styles.subtitle}>Today</Text>

        {/* Steps */}
        <Card>
          <View style={styles.metricHeader}>
            <Ionicons name="footsteps-outline" size={20} color={colors.steps} />
            <Text style={styles.metricTitle}>Steps</Text>
            {todayActivity && <SourceBadge source={todayActivity.source} />}
          </View>
          <Text style={styles.metricValue}>
            {todayActivity?.steps.toLocaleString() ?? '--'}
          </Text>
          <View style={styles.goalRow}>
            <View style={styles.goalBar}>
              <ProgressBar
                progress={todayActivity ? todayActivity.steps / 10000 : 0}
                color={colors.steps}
              />
            </View>
            <Text style={styles.goalText}>/ 10,000</Text>
          </View>
        </Card>

        {/* Active Minutes */}
        <Card>
          <View style={styles.metricHeader}>
            <Ionicons name="walk-outline" size={20} color={colors.activity} />
            <Text style={styles.metricTitle}>Active Minutes</Text>
            {todayActivity && <SourceBadge source={todayActivity.source} />}
          </View>
          <Text style={styles.metricValue}>
            {todayActivity || todayWorkouts.length > 0 ? totalActiveMinutes : '--'}
            <Text style={styles.metricUnit}> min</Text>
          </Text>
          {workoutActiveMinutes > 0 && todayActivity && (
            <Text style={styles.activeBreakdown}>
              {todayActivity.activeMinutes} activity + {workoutActiveMinutes} workouts
            </Text>
          )}
          <View style={styles.goalRow}>
            <View style={styles.goalBar}>
              <ProgressBar
                progress={totalActiveMinutes / 30}
                color={colors.activity}
              />
            </View>
            <Text style={styles.goalText}>/ 30 min</Text>
          </View>
        </Card>

        {/* Today's Workouts */}
        {todayWorkouts.length > 0 && (
          <Card>
            <Text style={styles.sectionTitle}>Today's Workouts</Text>
            <View style={styles.workoutList}>
              {todayWorkouts.map((w, idx) => (
                <View key={w.id}>
                  {idx > 0 && <View style={styles.workoutDivider} />}
                  <View style={styles.workoutRow}>
                    <View style={[styles.workoutIconWrap, { backgroundColor: WORKOUT_COLORS[w.activityType] + '20' }]}>
                      <WorkoutIcon type={w.activityType} color={WORKOUT_COLORS[w.activityType]} />
                    </View>
                    <View style={styles.workoutInfo}>
                      <Text style={styles.workoutName}>{w.name}</Text>
                      <Text style={styles.workoutMeta}>
                        {w.durationMinutes} min
                        {w.distanceMeters ? `  ·  ${(w.distanceMeters / 1000).toFixed(1)} km` : ''}
                        {w.caloriesBurned ? `  ·  ${w.caloriesBurned} kcal` : ''}
                      </Text>
                    </View>
                    <View style={styles.workoutRight}>
                      {w.avgHeartRate && (
                        <View style={styles.workoutHR}>
                          <Ionicons name="heart" size={11} color={colors.heart} />
                          <Text style={styles.workoutHRText}>{w.avgHeartRate}</Text>
                        </View>
                      )}
                      <SourceBadge source={w.source} />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Calories */}
        <Card>
          <View style={styles.metricHeader}>
            <Ionicons name="flame-outline" size={20} color={colors.calories} />
            <Text style={styles.metricTitle}>Calories</Text>
            {todayActivity && <SourceBadge source={todayActivity.source} />}
          </View>
          <View style={styles.calorieRow}>
            <View style={styles.calorieItem}>
              <Text style={styles.calorieValue}>
                {todayActivity?.caloriesTotal.toLocaleString() ?? '--'}
              </Text>
              <Text style={styles.calorieLabel}>Total</Text>
            </View>
            <View style={styles.calorieDivider} />
            <View style={styles.calorieItem}>
              <Text style={styles.calorieValue}>
                {todayActivity?.caloriesActive.toLocaleString() ?? '--'}
              </Text>
              <Text style={styles.calorieLabel}>Active</Text>
            </View>
          </View>
        </Card>

        {/* Distance */}
        <Card>
          <View style={styles.metricHeader}>
            <Ionicons name="navigate-outline" size={20} color={colors.info} />
            <Text style={styles.metricTitle}>Distance</Text>
            {todayActivity && <SourceBadge source={todayActivity.source} />}
          </View>
          <Text style={styles.metricValue}>
            {todayActivity ? (todayActivity.distanceMeters / 1000).toFixed(1) : '--'}
            <Text style={styles.metricUnit}> km</Text>
          </Text>
        </Card>

        {/* 7-Day Steps History */}
        <Card>
          <Text style={styles.sectionTitle}>7-Day Steps</Text>
          <View style={styles.historyContainer}>
            {activityHistory.map((day) => {
              const dayLabel = format(parseISO(day.date), 'EEE');
              const progress = Math.min(1, day.steps / 10000);
              return (
                <View key={day.id} style={styles.historyDay}>
                  <View style={styles.historyBarWrapper}>
                    <View
                      style={[
                        styles.historyBar,
                        {
                          height: `${progress * 100}%`,
                          backgroundColor: day.steps >= 10000 ? colors.success : colors.steps,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.historyValue}>
                    {(day.steps / 1000).toFixed(1)}k
                  </Text>
                  <Text style={styles.historyLabel}>{dayLabel}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.historyStats}>
            <View style={styles.historyStat}>
              <Text style={styles.historyStatValue}>
                {activityHistory.length > 0
                  ? Math.round(activityHistory.reduce((sum, d) => sum + d.steps, 0) / activityHistory.length).toLocaleString()
                  : '--'}
              </Text>
              <Text style={styles.historyStatLabel}>Avg Steps</Text>
            </View>
            <View style={styles.historyStat}>
              <Text style={styles.historyStatValue}>
                {activityHistory.length > 0
                  ? `${Math.round(activityHistory.reduce((sum, d) => sum + d.activeMinutes, 0) / activityHistory.length)} min`
                  : '--'}
              </Text>
              <Text style={styles.historyStatLabel}>Avg Active</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  metricTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  metricValue: {
    ...typography.metric,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  metricUnit: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  goalBar: {
    flex: 1,
  },
  goalText: {
    ...typography.caption,
    color: colors.textTertiary,
    flexShrink: 0,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calorieItem: {
    flex: 1,
    alignItems: 'center',
  },
  calorieValue: {
    ...typography.metricSmall,
    color: colors.textPrimary,
  },
  calorieLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  calorieDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  // History chart
  historyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: spacing.lg,
  },
  historyDay: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  historyBarWrapper: {
    flex: 1,
    width: 20,
    justifyContent: 'flex-end',
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: colors.progressBackground,
  },
  historyBar: {
    width: '100%',
    borderRadius: 4,
  },
  historyValue: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  historyLabel: {
    fontSize: 10,
    color: colors.textTertiary,
  },
  historyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  historyStat: {
    alignItems: 'center',
  },
  historyStatValue: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  historyStatLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
  },
  activeBreakdown: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  workoutList: {
    gap: 0,
  },
  workoutDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  workoutIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  workoutMeta: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
  },
  workoutRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  workoutHR: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  workoutHRText: {
    ...typography.caption,
    color: colors.heart,
    fontWeight: '600',
  },
});
