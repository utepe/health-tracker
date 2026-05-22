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

export default function ActivityScreen() {
  const { todayActivity, activityHistory } = useHealthStore();

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
            {todayActivity?.activeMinutes ?? '--'}
            <Text style={styles.metricUnit}> min</Text>
          </Text>
          <View style={styles.goalRow}>
            <View style={styles.goalBar}>
              <ProgressBar
                progress={todayActivity ? todayActivity.activeMinutes / 30 : 0}
                color={colors.activity}
              />
            </View>
            <Text style={styles.goalText}>/ 30 min</Text>
          </View>
        </Card>

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
});
