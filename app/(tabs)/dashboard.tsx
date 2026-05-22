import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { MetricCard } from '../../src/components/cards/MetricCard';
import { RecoveryCard } from '../../src/components/cards/RecoveryCard';
import { useHealthStore } from '../../src/stores/healthStore';
import { computeSleepScore } from '../../src/utils/sleepScoring';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  if (hour < 21) return 'Good Evening';
  return 'Good Night';
}

export default function DashboardScreen() {
  const { todaySleep, todayActivity, todayHeart, todayRecovery } = useHealthStore();

  const router = useRouter();
  const today = format(new Date(), 'EEEE, MMMM d');
  const sleepScore = todaySleep ? computeSleepScore(todaySleep, todayHeart) : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.date}>{today}</Text>
          </View>
          <Pressable onPress={() => router.push('/settings')} style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Recovery Score - full width */}
        <RecoveryCard score={todayRecovery?.recoveryScore ?? 0} source={todayRecovery?.source} />

        {/* Metric Grid */}
        <View style={styles.grid}>
          <MetricCard
            title="Sleep"
            value={todaySleep ? `${Math.floor(todaySleep.durationMinutes / 60)}h ${todaySleep.durationMinutes % 60}m` : '--'}
            subtitle={sleepScore ? `Score: ${sleepScore.overall}` : undefined}
            icon="moon-outline"
            color={colors.sleep}
            progress={sleepScore ? sleepScore.overall / 100 : 0}
            source={todaySleep?.source}
          />
          <MetricCard
            title="Steps"
            value={todayActivity?.steps.toLocaleString() ?? '--'}
            subtitle="/ 10,000"
            icon="footsteps-outline"
            color={colors.steps}
            progress={todayActivity ? todayActivity.steps / 10000 : 0}
            source={todayActivity?.source}
          />
        </View>

        <View style={styles.grid}>
          <MetricCard
            title="Resting HR"
            value={todayHeart?.restingHR ? `${todayHeart.restingHR} bpm` : '--'}
            icon="heart-outline"
            color={colors.heart}
            trend={todayHeart?.restingHR ? { value: 2, isPositive: false } : undefined}
            source={todayHeart?.source}
          />
          <MetricCard
            title="HRV"
            value={todayHeart?.hrvAvg ? `${Math.round(todayHeart.hrvAvg)} ms` : '--'}
            icon="pulse-outline"
            color={colors.recovery}
            trend={todayHeart?.hrvAvg ? { value: 5, isPositive: true } : undefined}
            source={todayHeart?.source}
          />
        </View>

        <View style={styles.grid}>
          <MetricCard
            title="Readiness"
            value={todayHeart?.readinessScore?.toString() ?? '--'}
            subtitle="/ 100"
            icon="battery-half-outline"
            color={colors.bodyBattery}
            progress={todayHeart ? (todayHeart.readinessScore ?? 0) / 100 : 0}
            source={todayHeart?.source}
          />
          <MetricCard
            title="Stress"
            value={todayHeart?.stressScore?.toString() ?? '--'}
            subtitle="/ 100"
            icon="fitness-outline"
            color={colors.stress}
            progress={todayHeart ? (todayHeart.stressScore ?? 0) / 100 : 0}
            source={todayHeart?.source}
          />
        </View>

        <View style={styles.grid}>
          <MetricCard
            title="Active Min"
            value={todayActivity?.activeMinutes?.toString() ?? '--'}
            subtitle="/ 30 min"
            icon="walk-outline"
            color={colors.activity}
            progress={todayActivity ? todayActivity.activeMinutes / 30 : 0}
            source={todayActivity?.source}
          />
          <MetricCard
            title="Calories"
            value={todayActivity?.caloriesActive?.toLocaleString() ?? '--'}
            subtitle="active"
            icon="flame-outline"
            color={colors.calories}
            source={todayActivity?.source}
          />
        </View>
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
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  settingsButton: {
    padding: spacing.sm,
  },
  greeting: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  date: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
