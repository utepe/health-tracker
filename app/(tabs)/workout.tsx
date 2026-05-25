import { useState, useEffect } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card } from '../../src/components/ui/Card';
import { TemplatePreviewModal } from '../../src/components/workout/TemplatePreviewModal';
import { useWorkoutStore } from '../../src/stores/workoutStore';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutTemplate, WorkoutSession } from '../../src/models/workout';

const SEED_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'tpl_push_a',
    name: 'Push Day A',
    lastPerformed: '2026-05-21',
    createdAt: '2026-05-01T00:00:00.000Z',
    exercises: [
      { exerciseId: 'ex_bench_press',              order: 0, targetSets: 3, supersetGroup: null, restSeconds: 180, notes: null },
      { exerciseId: 'ex_overhead_press',           order: 1, targetSets: 3, supersetGroup: null, restSeconds: 150, notes: null },
      { exerciseId: 'ex_incline_bench_press',      order: 2, targetSets: 3, supersetGroup: null, restSeconds: 120, notes: null },
      { exerciseId: 'ex_lateral_raise',            order: 3, targetSets: 3, supersetGroup: null, restSeconds: 90,  notes: null },
      { exerciseId: 'ex_tricep_pushdown',          order: 4, targetSets: 3, supersetGroup: null, restSeconds: 90,  notes: null },
    ],
  },
  {
    id: 'tpl_pull_a',
    name: 'Pull Day A',
    lastPerformed: '2026-05-22',
    createdAt: '2026-05-01T00:00:00.000Z',
    exercises: [
      { exerciseId: 'ex_deadlift',                 order: 0, targetSets: 3, supersetGroup: null, restSeconds: 240, notes: null },
      { exerciseId: 'ex_barbell_row',              order: 1, targetSets: 3, supersetGroup: null, restSeconds: 150, notes: null },
      { exerciseId: 'ex_pull_up',                  order: 2, targetSets: 3, supersetGroup: null, restSeconds: 120, notes: null },
      { exerciseId: 'ex_seated_cable_row',         order: 3, targetSets: 3, supersetGroup: null, restSeconds: 90,  notes: null },
      { exerciseId: 'ex_dumbbell_curl',            order: 4, targetSets: 3, supersetGroup: null, restSeconds: 90,  notes: null },
    ],
  },
  {
    id: 'tpl_legs_a',
    name: 'Legs Day A',
    lastPerformed: '2026-05-20',
    createdAt: '2026-05-01T00:00:00.000Z',
    exercises: [
      { exerciseId: 'ex_squat',                    order: 0, targetSets: 4, supersetGroup: null, restSeconds: 240, notes: null },
      { exerciseId: 'ex_romanian_deadlift',        order: 1, targetSets: 3, supersetGroup: null, restSeconds: 150, notes: null },
      { exerciseId: 'ex_leg_press',                order: 2, targetSets: 3, supersetGroup: null, restSeconds: 120, notes: null },
      { exerciseId: 'ex_leg_extension',            order: 3, targetSets: 3, supersetGroup: null, restSeconds: 90,  notes: null },
      { exerciseId: 'ex_calf_raise',               order: 4, targetSets: 4, supersetGroup: null, restSeconds: 60,  notes: null },
    ],
  },
];

export default function WorkoutScreen() {
  const router = useRouter();
  const { templates, activeSession, startSession, addExerciseToSession, setTemplates } = useWorkoutStore();
  const [previewTemplate, setPreviewTemplate] = useState<WorkoutTemplate | null>(null);

  useEffect(() => {
    if (templates.length === 0) {
      setTemplates(SEED_TEMPLATES);
    }
  }, []);

  const handleStartEmpty = () => {
    const session: WorkoutSession = {
      id: `session_${Date.now()}`,
      templateId: null,
      name: 'Quick Workout',
      startTime: new Date().toISOString(),
      endTime: null,
      status: 'active',
      avgHeartRate: null,
      maxHeartRate: null,
      caloriesBurned: null,
    };
    startSession(session);
    router.push('/workout/active');
  };

  const handleStartFromTemplate = (template: WorkoutTemplate) => {
    setPreviewTemplate(null);
    const session: WorkoutSession = {
      id: `session_${Date.now()}`,
      templateId: template.id,
      name: template.name,
      startTime: new Date().toISOString(),
      endTime: null,
      status: 'active',
      avgHeartRate: null,
      maxHeartRate: null,
      caloriesBurned: null,
    };
    startSession(session);
    // Pre-populate exercises from template
    template.exercises.forEach((e) => {
      addExerciseToSession(e.exerciseId, e.restSeconds);
    });
    router.push('/workout/active');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Workout</Text>

        {/* Quick Start */}
        <Pressable style={styles.startButton} onPress={handleStartEmpty}>
          <Ionicons name="add-circle" size={24} color={colors.textPrimary} />
          <Text style={styles.startButtonText}>Start Empty Workout</Text>
        </Pressable>

        {/* Active Session Banner */}
        {activeSession && (
          <Card style={styles.activeCard}>
            <View style={styles.activeHeader}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>Workout in Progress</Text>
            </View>
            <Text style={styles.activeName}>{activeSession.name}</Text>
            <Pressable style={styles.resumeButton} onPress={() => router.push('/workout/active')}>
              <Text style={styles.resumeText}>Resume</Text>
            </Pressable>
          </Card>
        )}

        {/* Templates */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Templates</Text>
          <Pressable onPress={() => router.push('/workout/template')}>
            <Ionicons name="add" size={24} color={colors.textSecondary} />
          </Pressable>
        </View>

        {templates.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="barbell-outline" size={40} color={colors.textTertiary} />
            <Text style={styles.emptyText}>No templates yet</Text>
            <Text style={styles.emptySubtext}>
              Create a workout template to quickly start your routine
            </Text>
          </Card>
        ) : (
          templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onPress={() => setPreviewTemplate(template)}
              onEdit={() => router.push(`/workout/template?id=${template.id}`)}
            />
          ))
        )}

        {/* Recent Workouts */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Workouts</Text>
          <Pressable onPress={() => router.push('/workout/history')}>
            <Text style={styles.viewAllText}>View All</Text>
          </Pressable>
        </View>

        <Card style={styles.emptyCard}>
          <Ionicons name="time-outline" size={40} color={colors.textTertiary} />
          <Text style={styles.emptyText}>No workouts yet</Text>
          <Text style={styles.emptySubtext}>
            Start a workout to see your history here
          </Text>
        </Card>
      </ScrollView>

      <TemplatePreviewModal
        visible={previewTemplate !== null}
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        onStart={() => previewTemplate && handleStartFromTemplate(previewTemplate)}
        onEdit={() => {
          if (previewTemplate) {
            setPreviewTemplate(null);
            router.push(`/workout/template?id=${previewTemplate.id}`);
          }
        }}
      />
    </SafeAreaView>
  );
}

function TemplateCard({
  template,
  onPress,
  onEdit,
}: {
  template: WorkoutTemplate;
  onPress: () => void;
  onEdit: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.templateCard}>
        <View style={styles.templateHeader}>
          <Text style={styles.templateName}>{template.name}</Text>
          <Pressable onPress={onEdit} hitSlop={8}>
            <Ionicons name="create-outline" size={18} color={colors.textTertiary} />
          </Pressable>
        </View>
        <Text style={styles.templateExercises}>
          {template.exercises.length} exercise{template.exercises.length !== 1 ? 's' : ''}
        </Text>
        {template.lastPerformed && (
          <Text style={styles.templateLastPerformed}>
            Last: {template.lastPerformed}
          </Text>
        )}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    paddingVertical: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderStyle: 'dashed',
  },
  startButtonText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  activeCard: {
    borderColor: colors.activity,
    borderWidth: 1,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.activity,
  },
  activeText: {
    ...typography.caption,
    color: colors.activity,
    textTransform: 'uppercase',
  },
  activeName: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  resumeButton: {
    backgroundColor: colors.activity,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  resumeText: {
    ...typography.body,
    color: colors.background,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  viewAllText: {
    ...typography.bodySmall,
    color: colors.activity,
    fontWeight: '500',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
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
  templateCard: {
    marginBottom: spacing.sm,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  templateExercises: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  templateLastPerformed: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
});
