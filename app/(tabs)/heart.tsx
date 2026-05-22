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

export default function HeartScreen() {
  const { todayHeart, heartHistory } = useHealthStore();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Heart & Stress</Text>
        <Text style={styles.subtitle}>Today</Text>

        {/* Resting Heart Rate */}
        <Card>
          <View style={styles.metricHeader}>
            <Ionicons name="heart" size={20} color={colors.heart} />
            <Text style={styles.metricTitle}>Resting Heart Rate</Text>
            {todayHeart && <SourceBadge source={todayHeart.source} />}
          </View>
          <Text style={styles.metricValue}>
            {todayHeart?.restingHR ?? '--'}
            <Text style={styles.metricUnit}> bpm</Text>
          </Text>
        </Card>

        {/* HRV */}
        <Card>
          <View style={styles.metricHeader}>
            <Ionicons name="pulse" size={20} color={colors.recovery} />
            <Text style={styles.metricTitle}>Heart Rate Variability</Text>
            {todayHeart && <SourceBadge source={todayHeart.source} />}
          </View>
          <Text style={styles.metricValue}>
            {todayHeart?.hrvAvg ? Math.round(todayHeart.hrvAvg) : '--'}
            <Text style={styles.metricUnit}> ms</Text>
          </Text>
          <Text style={styles.metricDescription}>
            Higher HRV indicates better recovery and fitness
          </Text>
        </Card>

        {/* Readiness */}
        <Card>
          <View style={styles.metricHeader}>
            <Ionicons name="battery-half-outline" size={20} color={colors.bodyBattery} />
            <Text style={styles.metricTitle}>Readiness</Text>
            {todayHeart && <SourceBadge source={todayHeart.source} />}
          </View>
          <View style={styles.batteryRow}>
            <Text style={styles.metricValue}>
              {todayHeart?.readinessScore ?? '--'}
            </Text>
            <Text style={styles.batteryRange}>
              {todayHeart?.readinessLow != null && todayHeart?.readinessHigh != null
                ? `${todayHeart.readinessLow} - ${todayHeart.readinessHigh}`
                : ''}
            </Text>
          </View>
          <ProgressBar
            progress={(todayHeart?.readinessScore ?? 0) / 100}
            color={colors.bodyBattery}
            height={10}
          />
        </Card>

        {/* Stress */}
        <Card>
          <View style={styles.metricHeader}>
            <Ionicons name="fitness-outline" size={20} color={colors.stress} />
            <Text style={styles.metricTitle}>Stress Score</Text>
            {todayHeart && <SourceBadge source={todayHeart.source} />}
          </View>
          <Text style={styles.metricValue}>
            {todayHeart?.stressScore ?? '--'}
            <Text style={styles.metricUnit}> / 100</Text>
          </Text>
          <ProgressBar
            progress={(todayHeart?.stressScore ?? 0) / 100}
            color={colors.stress}
          />
          <Text style={[styles.metricDescription, { marginTop: spacing.sm }]}>
            {getStressLabel(todayHeart?.stressScore ?? null)}
          </Text>
        </Card>

        {/* 7-Day Resting HR History */}
        <Card>
          <Text style={styles.sectionTitle}>7-Day Resting HR</Text>
          <View style={styles.historyContainer}>
            {heartHistory.map((day) => {
              const dayLabel = format(parseISO(day.date), 'EEE');
              // Scale: 40-70 bpm range for bar height
              const normalized = day.restingHR
                ? Math.min(1, Math.max(0, (day.restingHR - 40) / 30))
                : 0;
              return (
                <View key={day.id} style={styles.historyDay}>
                  <View style={styles.historyBarWrapper}>
                    <View
                      style={[
                        styles.historyBar,
                        {
                          height: `${normalized * 100}%`,
                          backgroundColor: colors.heart,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.historyValue}>
                    {day.restingHR ?? '--'}
                  </Text>
                  <Text style={styles.historyLabel}>{dayLabel}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.historyStats}>
            <View style={styles.historyStat}>
              <Text style={styles.historyStatValue}>
                {heartHistory.length > 0
                  ? `${Math.round(heartHistory.reduce((sum, d) => sum + (d.restingHR ?? 0), 0) / heartHistory.length)} bpm`
                  : '--'}
              </Text>
              <Text style={styles.historyStatLabel}>Avg RHR</Text>
            </View>
            <View style={styles.historyStat}>
              <Text style={styles.historyStatValue}>
                {heartHistory.length > 0
                  ? `${Math.round(heartHistory.reduce((sum, d) => sum + (d.hrvAvg ?? 0), 0) / heartHistory.length)} ms`
                  : '--'}
              </Text>
              <Text style={styles.historyStatLabel}>Avg HRV</Text>
            </View>
          </View>
        </Card>

        {/* 7-Day Readiness History */}
        <Card>
          <Text style={styles.sectionTitle}>7-Day Readiness</Text>
          <View style={styles.historyContainer}>
            {heartHistory.map((day) => {
              const dayLabel = format(parseISO(day.date), 'EEE');
              const progress = (day.readinessScore ?? 0) / 100;
              const barColor = (day.readinessScore ?? 0) >= 67
                ? colors.success
                : (day.readinessScore ?? 0) >= 34
                  ? colors.warning
                  : colors.error;
              return (
                <View key={day.id} style={styles.historyDay}>
                  <View style={styles.historyBarWrapper}>
                    <View
                      style={[
                        styles.historyBar,
                        {
                          height: `${progress * 100}%`,
                          backgroundColor: barColor,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.historyValue}>
                    {day.readinessScore ?? '--'}
                  </Text>
                  <Text style={styles.historyLabel}>{dayLabel}</Text>
                </View>
              );
            })}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function getStressLabel(score: number | null): string {
  if (score === null) return 'No data available';
  if (score <= 25) return 'Rest - Very low stress';
  if (score <= 50) return 'Low - Manageable stress';
  if (score <= 75) return 'Medium - Elevated stress';
  return 'High - Consider rest';
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
  metricDescription: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  batteryRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  batteryRange: {
    ...typography.bodySmall,
    color: colors.textTertiary,
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
