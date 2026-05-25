import { useState, useMemo } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';
import { Exercise, MuscleGroup, Equipment } from '../../src/models/workout';
import { useExercisePickerStore } from '../../src/stores/exercisePickerStore';
import { useWorkoutStore } from '../../src/stores/workoutStore';
import exercisesData from '../../src/data/exercises.json';

const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'forearms', 'core', 'quads', 'hamstrings', 'glutes', 'calves', 'cardio',
];

const EQUIPMENT_OPTIONS: Equipment[] = [
  'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'kettlebell', 'bands', 'other',
];

const builtInExercises = exercisesData as Exercise[];

const EMPTY_FORM = {
  name: '',
  muscleGroup: 'chest' as MuscleGroup,
  equipment: 'barbell' as Equipment,
  instructions: '',
};

export default function ExercisePickerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; replaceId?: string }>();
  const { customExercises, addCustomExercise, updateCustomExercise } = useWorkoutStore();

  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<MuscleGroup | null>(null);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const allExercises = useMemo(
    () => [...builtInExercises, ...customExercises],
    [customExercises]
  );

  const filtered = useMemo(() => {
    let result = allExercises;
    if (selectedGroup) {
      result = result.filter(
        (e) => e.muscleGroup === selectedGroup || e.secondaryMuscles.includes(selectedGroup)
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((e) => e.name.toLowerCase().includes(q));
    }
    return result;
  }, [search, selectedGroup, allExercises]);

  const toggleExercise = (id: string) => {
    setSelectedExercises((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const { setSelected } = useExercisePickerStore();

  const handleDone = () => {
    setSelected(selectedExercises);
    router.back();
  };

  const handleSelectForReplace = (id: string) => {
    setSelected([id]);
    router.back();
  };

  const handleOpenEdit = (exercise: Exercise) => {
    setEditingExerciseId(exercise.id);
    setForm({
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      equipment: exercise.equipment,
      instructions: exercise.instructions,
    });
    setShowCreateModal(true);
  };

  const handleSaveExercise = () => {
    if (!form.name.trim()) return;
    if (editingExerciseId) {
      updateCustomExercise(editingExerciseId, {
        name: form.name.trim(),
        muscleGroup: form.muscleGroup,
        equipment: form.equipment,
        instructions: form.instructions.trim(),
      });
    } else {
      addCustomExercise({
        id: `ex_custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: form.name.trim(),
        muscleGroup: form.muscleGroup,
        secondaryMuscles: [],
        equipment: form.equipment,
        instructions: form.instructions.trim(),
        isCustom: true,
      });
    }
    setForm(EMPTY_FORM);
    setEditingExerciseId(null);
    setShowCreateModal(false);
  };

  const handleCloseModal = () => {
    setForm(EMPTY_FORM);
    setEditingExerciseId(null);
    setShowCreateModal(false);
  };

  const isReplaceMode = params.mode === 'replace';
  const isPickMode = params.mode === 'pick';

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {isReplaceMode ? 'Replace Exercise' : 'Exercises'}
        </Text>
        <View style={styles.headerRight}>
          <Pressable onPress={() => setShowCreateModal(true)} style={styles.headerButton}>
            <Ionicons name="add" size={24} color={colors.activity} />
          </Pressable>
          {isPickMode && (
            <Pressable onPress={handleDone} style={styles.headerButton}>
              <Text style={styles.doneText}>
                {selectedExercises.length > 0 ? `Add (${selectedExercises.length})` : 'Done'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
          </Pressable>
        )}
      </View>

      {/* Muscle Group Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        style={styles.filterScroll}
      >
        {MUSCLE_GROUPS.map((item) => (
          <Pressable
            key={item}
            style={[
              styles.filterChip,
              selectedGroup === item && styles.filterChipActive,
            ]}
            onPress={() => setSelectedGroup(selectedGroup === item ? null : item)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedGroup === item && styles.filterChipTextActive,
              ]}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Exercise List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isSelected = selectedExercises.includes(item.id);
          return (
            <Pressable
              style={[styles.exerciseRow, isSelected && styles.exerciseRowSelected]}
              onPress={() => {
                if (isReplaceMode) {
                  handleSelectForReplace(item.id);
                } else if (isPickMode) {
                  toggleExercise(item.id);
                }
              }}
            >
              <View style={styles.exerciseInfo}>
                <View style={styles.exerciseNameRow}>
                  <Text style={styles.exerciseName}>{item.name}</Text>
                  {item.isCustom && (
                    <View style={styles.customBadge}>
                      <Text style={styles.customBadgeText}>Custom</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.exerciseMeta}>
                  {item.muscleGroup.charAt(0).toUpperCase() + item.muscleGroup.slice(1)} • {item.equipment}
                </Text>
              </View>
              <View style={styles.rowActions}>
                {item.isCustom && !isReplaceMode && (
                  <Pressable
                    hitSlop={12}
                    style={styles.editButton}
                    onPress={(e) => { e.stopPropagation(); handleOpenEdit(item); }}
                  >
                    <Ionicons name="pencil-outline" size={18} color={colors.textTertiary} />
                  </Pressable>
                )}
                {isPickMode && (
                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24}
                    color={isSelected ? colors.activity : colors.textTertiary}
                  />
                )}
                {isReplaceMode && (
                  <Ionicons name="swap-horizontal" size={20} color={colors.textTertiary} />
                )}
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No exercises found</Text>
            {search.trim().length > 0 && (
              <Pressable
                style={styles.createPromptButton}
                onPress={() => {
                  setForm((f) => ({ ...f, name: search.trim() }));
                  setShowCreateModal(true);
                }}
              >
                <Ionicons name="add-circle-outline" size={18} color={colors.activity} />
                <Text style={styles.createPromptText}>
                  Create "{search.trim()}"
                </Text>
              </Pressable>
            )}
          </View>
        }
      />

      {/* Create Exercise Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCloseModal}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{editingExerciseId ? 'Edit Exercise' : 'New Exercise'}</Text>

            <Text style={styles.fieldLabel}>Name *</Text>
            <TextInput
              style={styles.textField}
              value={form.name}
              onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
              placeholder="e.g. Incline Dumbbell Curl"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={styles.fieldLabel}>Muscle Group</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {MUSCLE_GROUPS.map((mg) => (
                <Pressable
                  key={mg}
                  style={[styles.filterChip, form.muscleGroup === mg && styles.filterChipActive]}
                  onPress={() => setForm((f) => ({ ...f, muscleGroup: mg }))}
                >
                  <Text style={[styles.filterChipText, form.muscleGroup === mg && styles.filterChipTextActive]}>
                    {mg.charAt(0).toUpperCase() + mg.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Equipment</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {EQUIPMENT_OPTIONS.map((eq) => (
                <Pressable
                  key={eq}
                  style={[styles.filterChip, form.equipment === eq && styles.filterChipActive]}
                  onPress={() => setForm((f) => ({ ...f, equipment: eq }))}
                >
                  <Text style={[styles.filterChipText, form.equipment === eq && styles.filterChipTextActive]}>
                    {eq.charAt(0).toUpperCase() + eq.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Instructions (optional)</Text>
            <TextInput
              style={[styles.textField, styles.textArea]}
              value={form.instructions}
              onChangeText={(v) => setForm((f) => ({ ...f, instructions: v }))}
              placeholder="Describe the movement..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <Pressable style={styles.cancelBtn} onPress={handleCloseModal}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.saveBtn, !form.name.trim() && styles.saveBtnDisabled]}
                onPress={handleSaveExercise}
              >
                <Text style={styles.saveBtnText}>
                  {editingExerciseId ? 'Save Changes' : 'Save Exercise'}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  },
  headerButton: {
    minWidth: 44,
    padding: spacing.sm,
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  doneText: {
    ...typography.body,
    color: colors.activity,
    fontWeight: '600',
    textAlign: 'right',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    padding: 0,
  },
  filterScroll: {
    minHeight: 36,
    maxHeight: 36,
    marginBottom: spacing.md,
  },
  filterList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  filterChipActive: {
    backgroundColor: colors.activity,
    borderColor: colors.activity,
  },
  filterChipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.background,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  exerciseRowSelected: {
    backgroundColor: colors.surfaceElevated,
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  exerciseName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  customBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  customBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#a78bfa',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  exerciseMeta: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  editButton: {
    padding: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textTertiary,
  },
  createPromptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.activity,
    backgroundColor: 'rgba(74, 222, 128, 0.08)',
  },
  createPromptText: {
    ...typography.body,
    color: colors.activity,
    fontWeight: '600',
  },
  // Create modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  textField: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  chipRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    paddingVertical: spacing.md,
    borderRadius: 10,
    backgroundColor: colors.activity,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveBtnText: {
    ...typography.body,
    color: colors.background,
    fontWeight: '700',
  },
});
