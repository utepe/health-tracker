import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, parseISO } from 'date-fns';
import { Card } from '../../src/components/ui/Card';
import { ProgressBar } from '../../src/components/ui/ProgressBar';
import { SourceBadge } from '../../src/components/ui/SourceBadge';
import { useHealthStore } from '../../src/stores/healthStore';
import { computeSleepScore } from '../../src/utils/sleepScoring';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';

export default function SleepScreen() {
  const { todaySleep, todayHeart, sleepHistory, heartHistory } = useHealthStore();

  const totalMinutes = todaySleep?.durationMinutes ?? 0;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const scoreBreakdown = todaySleep ? computeSleepScore(todaySleep, todayHeart) : null;

  // Compute scores for each day in history (match heart data by date)
  const historyScores = sleepHistory.map((day) => {
    const heartForDay = heartHistory.find((h) => h.date === day.date) ?? null;
    return computeSleepScore(day, heartForDay);
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Sleep</Text>
        <Text style={styles.subtitle}>Last Night</Text>

        {/* Sleep Score */}
        <Card style={styles.scoreCard}>
          <View style={styles.scoreHeader}>
            <Text style={styles.scoreLabel}>SLEEP SCORE</Text>
            {todaySleep && <SourceBadge source={todaySleep.source} />}
          </View>
          <Text style={styles.scoreValue}>{scoreBreakdown?.overall ?? todaySleep?.sleepScore ?? '--'}</Text>
          <Text style={styles.duration}>
            {totalMinutes > 0 ? `${hours}h ${minutes}m` : 'No data'}
          </Text>
        </Card>

        {/* Score Breakdown (Apple Health + Garmin combined) */}
        {scoreBreakdown && (
          <Card>
            <Text style={styles.sectionTitle}>Score Breakdown</Text>

            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLabel}>
                <Text style={styles.breakdownTitle}>Duration</Text>
                <Text style={styles.breakdownSubtitle}>{scoreBreakdown.duration.label}</Text>
              </View>
              <Text style={styles.breakdownScore}>{scoreBreakdown.duration.score}</Text>
              <View style={styles.breakdownBar}>
                <ProgressBar
                  progress={scoreBreakdown.duration.score / 100}
                  color={getScoreColor(scoreBreakdown.duration.score)}
                />
              </View>
            </View>

            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLabel}>
                <Text style={styles.breakdownTitle}>Bedtime</Text>
                <Text style={styles.breakdownSubtitle}>{scoreBreakdown.bedtime.label}</Text>
              </View>
              <Text style={styles.breakdownScore}>{scoreBreakdown.bedtime.score}</Text>
              <View style={styles.breakdownBar}>
                <ProgressBar
                  progress={scoreBreakdown.bedtime.score / 100}
                  color={getScoreColor(scoreBreakdown.bedtime.score)}
                />
              </View>
            </View>

            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLabel}>
                <Text style={styles.breakdownTitle}>Architecture</Text>
                <Text style={styles.breakdownSubtitle}>{scoreBreakdown.architecture.label}</Text>
              </View>
              <Text style={styles.breakdownScore}>{scoreBreakdown.architecture.score}</Text>
              <View style={styles.breakdownBar}>
                <ProgressBar
                  progress={scoreBreakdown.architecture.score / 100}
                  color={getScoreColor(scoreBreakdown.architecture.score)}
                />
              </View>
            </View>

            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLabel}>
                <Text style={styles.breakdownTitle}>Stress & Recovery</Text>
                <Text style={styles.breakdownSubtitle}>{scoreBreakdown.stressRecovery.label}</Text>
              </View>
              <Text style={styles.breakdownScore}>{scoreBreakdown.stressRecovery.score}</Text>
              <View style={styles.breakdownBar}>
                <ProgressBar
                  progress={scoreBreakdown.stressRecovery.score / 100}
                  color={getScoreColor(scoreBreakdown.stressRecovery.score)}
                />
              </View>
            </View>

            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLabel}>
                <Text style={styles.breakdownTitle}>Interruptions</Text>
                <Text style={styles.breakdownSubtitle}>{scoreBreakdown.interruptions.label}</Text>
              </View>
              <Text style={styles.breakdownScore}>{scoreBreakdown.interruptions.score}</Text>
              <View style={styles.breakdownBar}>
                <ProgressBar
                  progress={scoreBreakdown.interruptions.score / 100}
                  color={getScoreColor(scoreBreakdown.interruptions.score)}
                />
              </View>
            </View>
          </Card>
        )}

        {/* Sleep Stages */}
        <Card>
          <Text style={styles.sectionTitle}>Sleep Stages</Text>

          <View style={styles.stageRow}>
            <View style={styles.stageLabel}>
              <View style={[styles.stageDot, { backgroundColor: '#5B4FCF' }]} />
              <Text style={styles.stageText}>Deep</Text>
            </View>
            <Text style={styles.stageValue}>
              {todaySleep ? `${Math.floor(todaySleep.deepMinutes / 60)}h ${todaySleep.deepMinutes % 60}m` : '--'}
            </Text>
            <View style={styles.stageBar}>
              <ProgressBar
                progress={todaySleep ? todaySleep.deepMinutes / totalMinutes : 0}
                color="#5B4FCF"
              />
            </View>
          </View>

          <View style={styles.stageRow}>
            <View style={styles.stageLabel}>
              <View style={[styles.stageDot, { backgroundColor: '#7C6BFF' }]} />
              <Text style={styles.stageText}>Light</Text>
            </View>
            <Text style={styles.stageValue}>
              {todaySleep ? `${Math.floor(todaySleep.lightMinutes / 60)}h ${todaySleep.lightMinutes % 60}m` : '--'}
            </Text>
            <View style={styles.stageBar}>
              <ProgressBar
                progress={todaySleep ? todaySleep.lightMinutes / totalMinutes : 0}
                color="#7C6BFF"
              />
            </View>
          </View>

          <View style={styles.stageRow}>
            <View style={styles.stageLabel}>
              <View style={[styles.stageDot, { backgroundColor: '#38BDF8' }]} />
              <Text style={styles.stageText}>REM</Text>
            </View>
            <Text style={styles.stageValue}>
              {todaySleep ? `${Math.floor(todaySleep.remMinutes / 60)}h ${todaySleep.remMinutes % 60}m` : '--'}
            </Text>
            <View style={styles.stageBar}>
              <ProgressBar
                progress={todaySleep ? todaySleep.remMinutes / totalMinutes : 0}
                color="#38BDF8"
              />
            </View>
          </View>

          <View style={styles.stageRow}>
            <View style={styles.stageLabel}>
              <View style={[styles.stageDot, { backgroundColor: '#FF5757' }]} />
              <Text style={styles.stageText}>Awake</Text>
            </View>
            <Text style={styles.stageValue}>
              {todaySleep ? `${todaySleep.awakeMinutes}m` : '--'}
            </Text>
            <View style={styles.stageBar}>
              <ProgressBar
                progress={todaySleep ? todaySleep.awakeMinutes / totalMinutes : 0}
                color="#FF5757"
              />
            </View>
          </View>
        </Card>

        {/* 7-Day History */}
        <Card>
          <Text style={styles.sectionTitle}>7-Day Sleep Score</Text>
          <View style={styles.historyContainer}>
            {sleepHistory.map((day, index) => {
              const dayLabel = format(parseISO(day.date), 'EEE');
              const dayScore = historyScores[index]?.overall ?? 0;
              const barColor = dayScore >= 80 ? colors.success : dayScore >= 60 ? colors.warning : colors.error;
              return (
                <View key={day.id} style={styles.historyDay}>
                  <View style={styles.historyBarWrapper}>
                    <View
                      style={[
                        styles.historyBar,
                        {
                          height: `${dayScore}%`,
                          backgroundColor: barColor,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.historyValue}>{dayScore}</Text>
                  <Text style={styles.historyLabel}>{dayLabel}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.historyStats}>
            <View style={styles.historyStat}>
              <Text style={styles.historyStatValue}>
                {historyScores.length > 0
                  ? Math.round(historyScores.reduce((sum, s) => sum + s.overall, 0) / historyScores.length)
                  : '--'}
              </Text>
              <Text style={styles.historyStatLabel}>Avg Score</Text>
            </View>
            <View style={styles.historyStat}>
              <Text style={styles.historyStatValue}>
                {sleepHistory.length > 0
                  ? `${Math.floor(sleepHistory.reduce((sum, d) => sum + d.durationMinutes, 0) / sleepHistory.length / 60)}h ${Math.round(sleepHistory.reduce((sum, d) => sum + d.durationMinutes, 0) / sleepHistory.length % 60)}m`
                  : '--'}
              </Text>
              <Text style={styles.historyStatLabel}>Avg Duration</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return colors.success;
  if (score >= 60) return colors.warning;
  return colors.error;
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
  scoreCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scoreLabel: {
    ...typography.caption,
    color: colors.sleep,
    letterSpacing: 1,
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: '700',
    color: colors.textPrimary,
    marginVertical: spacing.sm,
  },
  duration: {
    ...typography.body,
    color: colors.textSecondary,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stageLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 70,
    gap: spacing.sm,
  },
  stageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stageText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  stageValue: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    width: 70,
    textAlign: 'right',
    marginRight: spacing.md,
  },
  stageBar: {
    flex: 1,
  },
  // Score breakdown
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  breakdownLabel: {
    width: 130,
  },
  breakdownTitle: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  breakdownSubtitle: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
  },
  breakdownScore: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '700',
    width: 36,
    textAlign: 'center',
  },
  breakdownBar: {
    flex: 1,
    marginLeft: spacing.sm,
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
