import { useState, useEffect } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';
import { useWorkoutStore } from '../../src/stores/workoutStore';
import { useExercisePickerStore } from '../../src/stores/exercisePickerStore';
import { Exercise, TemplateExercise, WorkoutTemplate } from '../../src/models/workout';
import exercisesData from '../../src/data/exercises.json';

const allExercises = exercisesData as Exercise[];

function getExercise(id: string): Exercise | undefined {
  return allExercises.find((e) => e.id === id);
}

export default function TemplateEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { templates, setTemplates } = useWorkoutStore();

  const existingTemplate = params.id ? templates.find((t) => t.id === params.id) : null;

  const [name, setName] = useState(existingTemplate?.name ?? '');
  const [exercises, setExercises] = useState<TemplateExercise[]>(
    existingTemplate?.exercises ?? []
  );

  // Pick up exercises from the picker store when returning from exercise picker
  const { selectedIds, clear: clearPicker } = useExercisePickerStore();
  useEffect(() => {
    if (selectedIds.length > 0) {
      const newExercises: TemplateExercise[] = selectedIds.map((id, i) => ({
        exerciseId: id,
        order: exercises.length + i,
        targetSets: 3,
        supersetGroup: null,
        restSeconds: 120,
        notes: null,
      }));
      setExercises((prev) => [...prev, ...newExercises]);
      clearPicker();
    }
  }, [selectedIds]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a template name');
      return;
    }

    const template: WorkoutTemplate = {
      id: existingTemplate?.id ?? `tmpl_${Date.now()}`,
      name: name.trim(),
      exercises,
      lastPerformed: existingTemplate?.lastPerformed ?? null,
      createdAt: existingTemplate?.createdAt ?? new Date().toISOString(),
    };

    if (existingTemplate) {
      setTemplates(templates.map((t) => (t.id === template.id ? template : t)));
    } else {
      setTemplates([...templates, template]);
    }

    router.back();
  };

  const handleDelete = () => {
    if (!existingTemplate) return;
    Alert.alert('Delete Template', `Delete "${existingTemplate.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setTemplates(templates.filter((t) => t.id !== existingTemplate.id));
          router.back();
        },
      },
    ]);
  };

  const addExercise = (exerciseId: string) => {
    const newExercise: TemplateExercise = {
      exerciseId,
      order: exercises.length,
      targetSets: 3,
      supersetGroup: null,
      restSeconds: 120,
      notes: null,
    };
    setExercises([...exercises, newExercise]);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, updates: Partial<TemplateExercise>) => {
    setExercises(exercises.map((e, i) => (i === index ? { ...e, ...updates } : e)));
  };

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === exercises.length - 1) return;
    const newList = [...exercises];
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    [newList[index], newList[swapIdx]] = [newList[swapIdx], newList[index]];
    newList.forEach((e, i) => (e.order = i));
    setExercises(newList);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {existingTemplate ? 'Edit Template' : 'New Template'}
        </Text>
        <Pressable onPress={handleSave} style={styles.headerButton}>
          <Text style={styles.saveText}>Save</Text>
        </Pressable>
      </View>

      <FlatList
        data={exercises}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.nameSection}>
            <Text style={styles.label}>Template Name</Text>
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Push Day A"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        }
        renderItem={({ item, index }) => {
          const exercise = getExercise(item.exerciseId);
          return (
            <View style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise?.name ?? 'Unknown'}</Text>
                  <Text style={styles.exerciseMeta}>
                    {exercise?.muscleGroup} • {exercise?.equipment}
                  </Text>
                </View>
                <View style={styles.exerciseActions}>
                  <Pressable onPress={() => moveExercise(index, 'up')} style={styles.actionBtn}>
                    <Ionicons name="chevron-up" size={18} color={colors.textTertiary} />
                  </Pressable>
                  <Pressable onPress={() => moveExercise(index, 'down')} style={styles.actionBtn}>
                    <Ionicons name="chevron-down" size={18} color={colors.textTertiary} />
                  </Pressable>
                  <Pressable onPress={() => removeExercise(index)} style={styles.actionBtn}>
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </Pressable>
                </View>
              </View>

              {/* Sets & Rest config */}
              <View style={styles.configRow}>
                <View style={styles.configItem}>
                  <Text style={styles.configLabel}>Sets</Text>
                  <View style={styles.stepper}>
                    <Pressable
                      onPress={() => updateExercise(index, { targetSets: Math.max(1, item.targetSets - 1) })}
                      style={styles.stepperBtn}
                    >
                      <Ionicons name="remove" size={16} color={colors.textSecondary} />
                    </Pressable>
                    <Text style={styles.stepperValue}>{item.targetSets}</Text>
                    <Pressable
                      onPress={() => updateExercise(index, { targetSets: item.targetSets + 1 })}
                      style={styles.stepperBtn}
                    >
                      <Ionicons name="add" size={16} color={colors.textSecondary} />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.configItem}>
                  <Text style={styles.configLabel}>Rest (s)</Text>
                  <View style={styles.stepper}>
                    <Pressable
                      onPress={() => updateExercise(index, { restSeconds: Math.max(15, item.restSeconds - 15) })}
                      style={styles.stepperBtn}
                    >
                      <Ionicons name="remove" size={16} color={colors.textSecondary} />
                    </Pressable>
                    <Text style={styles.stepperValue}>{item.restSeconds}</Text>
                    <Pressable
                      onPress={() => updateExercise(index, { restSeconds: item.restSeconds + 15 })}
                      style={styles.stepperBtn}
                    >
                      <Ionicons name="add" size={16} color={colors.textSecondary} />
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          <View style={styles.footer}>
            <Pressable
              style={styles.addExerciseButton}
              onPress={() => router.push('/workout/exercises?mode=pick')}
            >
              <Ionicons name="add" size={20} color={colors.activity} />
              <Text style={styles.addExerciseText}>Add Exercise</Text>
            </Pressable>

            {existingTemplate && (
              <Pressable style={styles.deleteButton} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={18} color={colors.error} />
                <Text style={styles.deleteText}>Delete Template</Text>
              </Pressable>
            )}
          </View>
        }
      />
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
    padding: spacing.sm,
    minWidth: 50,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  saveText: {
    ...typography.body,
    color: colors.activity,
    fontWeight: '600',
    textAlign: 'right',
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  nameSection: {
    marginBottom: spacing.xl,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  nameInput: {
    ...typography.h2,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  exerciseCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  exerciseMeta: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
  },
  exerciseActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionBtn: {
    padding: spacing.xs,
  },
  configRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.lg,
  },
  configItem: {
    flex: 1,
  },
  configLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepperBtn: {
    padding: spacing.sm,
  },
  stepperValue: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  footer: {
    marginTop: spacing.lg,
    gap: spacing.lg,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.activity,
    borderStyle: 'dashed',
  },
  addExerciseText: {
    ...typography.body,
    color: colors.activity,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  deleteText: {
    ...typography.body,
    color: colors.error,
  },
});
