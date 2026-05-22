import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';
import { useWorkoutStore } from '../../src/stores/workoutStore';

export default function WorkoutHistoryScreen() {
  const router = useRouter();
  // Placeholder - will be populated from DB
  const sessions: any[] = [];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Workout History</Text>
        <View style={styles.headerButton} />
      </View>

      {sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={48} color={colors.textTertiary} />
          <Text style={styles.emptyText}>No workout history yet</Text>
          <Text style={styles.emptySubtext}>
            Complete a workout to see your history here
          </Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <Text style={styles.sessionName}>{item.name}</Text>
                <Text style={styles.sessionDate}>{item.startTime}</Text>
              </View>
              <View style={styles.sessionStats}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{item.setCount}</Text>
                  <Text style={styles.statLabel}>Sets</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{item.duration}</Text>
                  <Text style={styles.statLabel}>Duration</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{item.volume}</Text>
                  <Text style={styles.statLabel}>Volume (kg)</Text>
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  emptySubtext: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  sessionCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  sessionHeader: {
    marginBottom: spacing.md,
  },
  sessionName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  sessionDate: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
  },
});
