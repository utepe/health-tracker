import { StyleSheet, View, ViewProps } from 'react-native';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated';
}

export function Card({ children, style, variant = 'default', ...props }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        variant === 'elevated' && styles.elevated,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  elevated: {
    backgroundColor: colors.surfaceElevated,
  },
});
