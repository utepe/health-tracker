import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../ui/Card';
import { SourceBadge, MetricSource } from '../ui/SourceBadge';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface RecoveryCardProps {
  score: number; // 0-100
  source?: MetricSource;
}

function getRecoveryColor(score: number): string {
  if (score >= 67) return colors.success;
  if (score >= 34) return colors.warning;
  return colors.error;
}

function getRecoveryLabel(score: number): string {
  if (score >= 67) return 'GREEN';
  if (score >= 34) return 'YELLOW';
  return 'RED';
}

export function RecoveryCard({ score, source }: RecoveryCardProps) {
  const color = getRecoveryColor(score);
  const label = getRecoveryLabel(score);

  return (
    <Card style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>RECOVERY</Text>
        {source && <SourceBadge source={source} />}
      </View>

      <View style={styles.scoreContainer}>
        <Text style={[styles.score, { color }]}>{score}%</Text>
        <View style={[styles.badge, { backgroundColor: color + '20' }]}>
          <Text style={[styles.badgeText, { color }]}>{label}</Text>
        </View>
      </View>

      <View style={styles.barContainer}>
        <View style={[styles.barFill, { width: `${score}%`, backgroundColor: color }]} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.caption,
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  score: {
    ...typography.metric,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '700',
  },
  barContainer: {
    height: 8,
    backgroundColor: colors.progressBackground,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
});
