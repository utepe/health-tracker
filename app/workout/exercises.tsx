import { useState, useMemo } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';
import { Exercise, MuscleGroup } from '../../src/models/workout';
import { useExercisePickerStore } from '../../src/stores/exercisePickerStore';
import exercisesData from '../../src/data/exercises.json';

const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'forearms', 'core', 'quads', 'hamstrings', 'glutes', 'calves', 'cardio',
];

export default function ExercisePickerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<MuscleGroup | null>(null);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);

  const exercises = exercisesData as Exercise[];

  const filtered = useMemo(() => {
    let result = exercises;
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
  }, [search, selectedGroup]);

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

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Exercises</Text>
        {params.mode === 'pick' ? (
          <Pressable onPress={handleDone} style={styles.headerButton}>
            <Text style={styles.doneText}>
              {selectedExercises.length > 0 ? `Add (${selectedExercises.length})` : 'Done'}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.headerButton} />
        )}
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
              onPress={() => params.mode === 'pick' ? toggleExercise(item.id) : null}
            >
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{item.name}</Text>
                <Text style={styles.exerciseMeta}>
                  {item.muscleGroup.charAt(0).toUpperCase() + item.muscleGroup.slice(1)} • {item.equipment}
                </Text>
              </View>
              {params.mode === 'pick' && (
                <Ionicons
                  name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={isSelected ? colors.activity : colors.textTertiary}
                />
              )}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No exercises found</Text>
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
  },
  headerButton: {
    minWidth: 60,
    padding: spacing.sm,
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
});
