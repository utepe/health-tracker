import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { CompletedWorkout, Exercise, SetType } from '../../models/workout';

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
    weekday: 'long', month: 'short', day: 'numeric', year: 'numeric',
  });
}

const setTypeColors: Record<SetType, string> = {
  working: colors.textSecondary,
  warmup: colors.warning,
  dropset: colors.info,
  failure: colors.error,
};

const setTypeLabels: Record<SetType, string> = {
  working: '',
  warmup: 'W',
  dropset: 'D',
  failure: 'F',
};

export function WorkoutSummaryModal({
  visible,
  workout,
  allExercises,
  onClose,
}: {
  visible: boolean;
  workout: CompletedWorkout | null;
  allExercises: Exercise[];
  onClose: () => void;
}) {
  if (!workout) return null;

  const getExercise = (id: string) => allExercises.find((e) => e.id === id);

  // Epley 1RM estimate
  const epley1RM = (weight: number, reps: number) =>
    reps === 1 ? weight : Math.round(weight * (1 + reps / 30));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.title} numberOfLines={1}>{workout.name}</Text>
            <View style={styles.closeButton} />
          </View>

          {/* Date */}
          <Text style={styles.dateText}>{formatDate(workout.startTime)}</Text>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.statText}>{formatDuration(workout.durationSeconds)}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="barbell-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.statText}>{Math.round(workout.totalVolumeKg).toLocaleString()} kg</Text>
            </View>
            {workout.prCount > 0 && (
              <View style={styles.statItem}>
                <Ionicons name="trophy" size={16} color={colors.warning} />
                <Text style={[styles.statText, { color: colors.warning }]}>
                  {workout.prCount} PR{workout.prCount !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Exercise list */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {workout.exercises.map(({ exerciseId, sets }) => {
              const exercise = getExercise(exerciseId);
              const completedSets = sets.filter((s) => s.completedAt !== '');
              if (completedSets.length === 0) return null;

              // Best 1RM for this exercise across all working sets
              const best1RM = completedSets
                .filter((s) => s.type === 'working' && s.weight && s.reps)
                .reduce((best, s) => {
                  const est = epley1RM(s.weight!, s.reps!);
                  return est > best ? est : best;
                }, 0);

              let workingSetIndex = 0;

              return (
                <View key={exerciseId} style={styles.exerciseBlock}>
                  <View style={styles.exerciseHeaderRow}>
                    <Text style={styles.exerciseName}>{exercise?.name ?? 'Unknown'}</Text>
                    {best1RM > 0 && (
                      <Text style={styles.oneRMLabel}>{best1RM} kg</Text>
                    )}
                  </View>

                  {completedSets.map((s) => {
                    const isWorking = s.type === 'working';
                    if (isWorking) workingSetIndex += 1;
                    const label = isWorking ? String(workingSetIndex) : setTypeLabels[s.type];
                    const labelColor = setTypeColors[s.type];
                    const vol = s.weight && s.reps ? epley1RM(s.weight, s.reps) : null;

                    return (
                      <View key={s.id} style={styles.setRow}>
                        <View style={styles.setLabelCol}>
                          {s.isPersonalRecord && (
                            <Ionicons name="trophy" size={11} color={colors.warning} style={styles.prIcon} />
                          )}
                          <Text style={[styles.setLabel, { color: labelColor }]}>{label}</Text>
                        </View>
                        <Text style={[styles.setDetail, s.isPersonalRecord && styles.prText]}>
                          {s.weight != null ? `${s.weight} kg` : 'BW'}{s.reps != null ? ` × ${s.reps}` : ''}
                        </Text>
                        {vol !== null && (
                          <Text style={styles.oneRMValue}>{vol}</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              );
            })}
            <View style={{ height: spacing.xxxl }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '92%',
    paddingTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  dateText: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  exerciseBlock: {
    marginBottom: spacing.xl,
  },
  exerciseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.xs,
  },
  exerciseName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '700',
    flex: 1,
  },
  oneRMLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  setLabelCol: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 28,
  },
  prIcon: {
    marginRight: 2,
  },
  setLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  setDetail: {
    flex: 1,
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  prText: {
    color: colors.warning,
    fontWeight: '600',
  },
  oneRMValue: {
    ...typography.caption,
    color: colors.textTertiary,
    minWidth: 32,
    textAlign: 'right',
  },
});
