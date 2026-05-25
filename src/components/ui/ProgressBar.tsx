import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/spacing';

interface ProgressBarProps {
  progress: number; // 0-1
  color?: string;
  height?: number;
}

export function ProgressBar({
  progress,
  color = colors.progressFill,
  height = 6,
}: ProgressBarProps) {
  const clampedProgress = Math.min(1, Math.max(0, progress));

  return (
    <View style={[styles.track, { height }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clampedProgress * 100}%`,
            backgroundColor: color,
            height,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.progressBackground,
    borderRadius: radius.sm,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    borderRadius: radius.sm,
  },
});
