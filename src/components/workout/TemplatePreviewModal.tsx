import { Modal, Pressable, ScrollView, StyleSheet, Text, View, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { WorkoutTemplate, Exercise } from '../../models/workout';
import exercisesData from '../../data/exercises.json';

const allExercises = exercisesData as Exercise[];

function getExercise(id: string): Exercise | undefined {
  return allExercises.find((e) => e.id === id);
}

interface TemplatePreviewModalProps {
  visible: boolean;
  template: WorkoutTemplate | null;
  onClose: () => void;
  onStart: () => void;
  onEdit: () => void;
}

export function TemplatePreviewModal({
  visible,
  template,
  onClose,
  onStart,
  onEdit,
}: TemplatePreviewModalProps) {
  if (!template) return null;

  const totalSets = template.exercises.reduce((sum, e) => sum + e.targetSets, 0);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>{template.name}</Text>
          <Pressable onPress={onEdit} style={styles.headerButton}>
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{template.exercises.length}</Text>
            <Text style={styles.summaryLabel}>Exercises</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalSets}</Text>
            <Text style={styles.summaryLabel}>Total Sets</Text>
          </View>
          {template.lastPerformed && (
            <>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {new Date(template.lastPerformed).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </Text>
                <Text style={styles.summaryLabel}>Last Done</Text>
              </View>
            </>
          )}
        </View>

        {/* Exercise List */}
        <ScrollView style={styles.scrollContent} contentContainerStyle={styles.listContent}>
          {template.exercises.map((templateExercise, index) => {
            const exercise = getExercise(templateExercise.exerciseId);
            return (
              <View key={index} style={styles.exerciseRow}>
                <View style={styles.exerciseOrder}>
                  <Text style={styles.orderText}>{index + 1}</Text>
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise?.name ?? 'Unknown'}</Text>
                  <Text style={styles.exerciseMeta}>
                    {templateExercise.targetSets} sets • {templateExercise.restSeconds}s rest
                    {exercise ? ` • ${exercise.muscleGroup}` : ''}
                  </Text>
                </View>
              </View>
            );
          })}

          {template.exercises.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No exercises in this template</Text>
            </View>
          )}
        </ScrollView>

        {/* Start Button */}
        <View style={styles.footer}>
          <Pressable style={styles.startButton} onPress={onStart}>
            <Ionicons name="play" size={20} color={colors.background} />
            <Text style={styles.startButtonText}>Start Workout</Text>
          </Pressable>
        </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  container: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    minWidth: 50,
    padding: spacing.sm,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  editText: {
    ...typography.body,
    color: colors.activity,
    fontWeight: '600',
    textAlign: 'right',
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
  scrollContent: {
    maxHeight: 300,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  exerciseOrder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  exerciseMeta: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textTertiary,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.activity,
    borderRadius: 12,
    paddingVertical: spacing.md,
  },
  startButtonText: {
    ...typography.body,
    color: colors.background,
    fontWeight: '700',
    fontSize: 16,
  },
});
