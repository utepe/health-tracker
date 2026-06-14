import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useState } from 'react';
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
  onSaveAsTemplate,
  onUpdateTemplate,
}: {
  visible: boolean;
  workout: CompletedWorkout | null;
  allExercises: Exercise[];
  onClose: () => void;
  onSaveAsTemplate?: (name: string) => void;
  onUpdateTemplate?: () => void;
}) {
  const [templateName, setTemplateName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  if (!workout) return null;

  const getExercise = (id: string) => allExercises.find((e) => e.id === id);

  // Epley 1RM estimate
  const epley1RM = (weight: number, reps: number) =>
    reps === 1 ? weight : Math.round(weight * (1 + reps / 30));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
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

          {/* Workout notes */}
          {!!workout.notes && (
            <View style={styles.workoutNotesWrap}>
              <Ionicons name="document-text-outline" size={13} color={colors.textTertiary} style={styles.noteIcon} />
              <Text style={styles.workoutNotesText}>{workout.notes}</Text>
            </View>
          )}

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

          {/* Template action footer — shown only when called from the active workout */}
          {(onSaveAsTemplate || onUpdateTemplate) && (
            <View style={styles.templateFooter}>
              {onUpdateTemplate && (
                <Pressable style={styles.templateButton} onPress={() => { onUpdateTemplate(); onClose(); }}>
                  <Ionicons name="refresh-outline" size={16} color={colors.textPrimary} />
                  <Text style={styles.templateButtonText}>Update Template</Text>
                </Pressable>
              )}
              {onSaveAsTemplate && !showNameInput && (
                <Pressable style={styles.templateButton} onPress={() => {
                  setTemplateName(workout.name);
                  setShowNameInput(true);
                }}>
                  <Ionicons name="bookmark-outline" size={16} color={colors.textPrimary} />
                  <Text style={styles.templateButtonText}>Save as Template</Text>
                </Pressable>
              )}
              {onSaveAsTemplate && showNameInput && (
                <View style={styles.nameInputRow}>
                  <TextInput
                    style={styles.nameInput}
                    value={templateName}
                    onChangeText={setTemplateName}
                    placeholder="Template name"
                    placeholderTextColor={colors.textTertiary}
                    autoFocus
                  />
                  <Pressable
                    style={[styles.saveConfirmButton, !templateName.trim() && styles.saveConfirmDisabled]}
                    onPress={() => {
                      if (!templateName.trim()) return;
                      onSaveAsTemplate(templateName.trim());
                      onClose();
                    }}
                  >
                    <Text style={styles.saveConfirmText}>Save</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}

          {/* Exercise list */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {workout.exercises.map(({ exerciseId, sets, notes: exerciseNotes }) => {
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
                  {!!exerciseNotes && (
                    <View style={styles.exerciseNotesWrap}>
                      <Ionicons name="document-text-outline" size={12} color={colors.textTertiary} style={styles.noteIcon} />
                      <Text style={styles.exerciseNotesText}>{exerciseNotes}</Text>
                    </View>
                  )}

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
        </Pressable>
      </Pressable>
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
  workoutNotesWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  noteIcon: {
    marginTop: 2,
  },
  workoutNotesText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  exerciseNotesWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  exerciseNotesText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 17,
    fontStyle: 'italic',
  },
  templateFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  templateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  templateButtonText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 13,
  },
  nameInputRow: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  nameInput: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveConfirmButton: {
    backgroundColor: colors.activity,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  saveConfirmDisabled: {
    opacity: 0.4,
  },
  saveConfirmText: {
    ...typography.body,
    color: '#000',
    fontWeight: '700',
  },
});
