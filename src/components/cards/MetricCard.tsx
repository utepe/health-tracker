import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { Ionicons } from '@expo/vector-icons';
import { SourceBadge, MetricSource } from '../ui/SourceBadge';
export type { MetricSource } from '../ui/SourceBadge';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  progress?: number; // 0-1, if provided shows progress bar
  trend?: { value: number; isPositive: boolean }; // e.g. +5 or -2
  source?: MetricSource; // data source attribution
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  color,
  progress,
  trend,
  source,
}: MetricCardProps) {
  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name={icon} size={18} color={color} />
          <Text style={[styles.title, { color }]}>{title}</Text>
        </View>
        {source && <SourceBadge source={source} />}
      </View>

      <Text style={styles.value}>{value}</Text>

      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

      {trend && (
        <View style={styles.trendContainer}>
          <Ionicons
            name={trend.isPositive ? 'arrow-up' : 'arrow-down'}
            size={12}
            color={trend.isPositive ? colors.success : colors.error}
          />
          <Text
            style={[
              styles.trendText,
              { color: trend.isPositive ? colors.success : colors.error },
            ]}
          >
            {Math.abs(trend.value)}
          </Text>
        </View>
      )}

      {progress !== undefined && (
        <View style={styles.progressContainer}>
          <ProgressBar progress={progress} color={color} />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 150,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    ...typography.metricSmall,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: spacing.xs,
  },
  trendText: {
    ...typography.caption,
  },
  progressContainer: {
    marginTop: spacing.sm,
  },
});
