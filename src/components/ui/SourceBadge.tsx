import { StyleSheet, Text, View } from 'react-native';
import { DataSource } from '../../models/common';

export type MetricSource = DataSource | 'combined';

const SOURCE_LABELS: Record<MetricSource, string> = {
  garmin: 'Garmin',
  apple_health: 'Apple Health',
  fitbit: 'Fitbit',
  combined: 'Combined',
};

const SOURCE_COLORS: Record<MetricSource, string> = {
  garmin: '#38BDF8',
  apple_health: '#FF5757',
  fitbit: '#4ADE80',
  combined: '#A78BFA',
};

interface SourceBadgeProps {
  source: MetricSource;
}

export function SourceBadge({ source }: SourceBadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: SOURCE_COLORS[source] + '20' }]}>
      <Text style={[styles.text, { color: SOURCE_COLORS[source] }]}>
        {SOURCE_LABELS[source]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
