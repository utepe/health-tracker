import { FlatList, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { format, parseISO } from 'date-fns';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';
import { useWorkoutStore } from '../../src/stores/workoutStore';
import { useHealthStore } from '../../src/stores/healthStore';
import { WorkoutSummaryModal } from '../../src/components/workout/WorkoutSummaryModal';
import { CompletedWorkout, Exercise } from '../../src/models/workout';
import { WorkoutRecord, WorkoutType } from '../../src/models/activity';
import builtInExercises from '../../src/data/exercises.json';
import { useState } from 'react';

type HistoryItem =
  | { kind: 'strength'; data: CompletedWorkout }
  | { kind: 'cardio'; data: WorkoutRecord };

const IONICONS_ICONS: Partial<Record<WorkoutType, keyof typeof Ionicons.glyphMap>> = {
  cycle: 'bicycle-outline',
  swim: 'water-outline',
  walk: 'footsteps-outline',
  hike: 'trail-sign-outline',
  strength: 'barbell-outline',
  yoga: 'body-outline',
  cardio: 'heart-outline',
  other: 'fitness-outline',
};

function WorkoutIcon({ type, color }: { type: WorkoutType; color: string }) {
  if (type === 'run') return <MaterialIcons name="directions-run" size={18} color={color} />;
  return <Ionicons name={IONICONS_ICONS[type] ?? 'fitness-outline'} size={18} color={color} />;
}

const WORKOUT_COLORS: Record<WorkoutType, string> = {
  run: colors.activity,
  cycle: colors.info,
  swim: '#60D5FA',
  walk: colors.steps,
  hike: '#A3E635',
  strength: colors.stress,
  yoga: colors.sleep,
  cardio: colors.heart,
  other: colors.textSecondary,
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(iso: string): string {
  return format(parseISO(iso), 'EEE, MMM d · h:mm a');
}

function confirmDelete(message: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(message)) onConfirm();
  } else {
    const { Alert } = require('react-native');
    Alert.alert('Delete Workout', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onConfirm },
    ]);
  }
}

export default function WorkoutHistoryScreen() {
  const router = useRouter();
  const {
    completedWorkouts, customExercises,
    saveAsTemplate, deleteCompletedWorkout, renameCompletedWorkout,
  } = useWorkoutStore();
  const { workoutRecords, deleteWorkoutRecord, renameWorkoutRecord } = useHealthStore();

  const allExercises = [...(builtInExercises as Exercise[]), ...customExercises];

  const [summaryWorkout, setSummaryWorkout] = useState<CompletedWorkout | null>(null);
  // Which card's menu is open: `${kind}:${id}`
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  // Rename modal state
  const [renameTarget, setRenameTarget] = useState<{ kind: 'strength' | 'cardio'; id: string; name: string } | null>(null);
  const [renameDraft, setRenameDraft] = useState('');

  const toggleMenu = (id: string) => setOpenMenuId((prev) => (prev === id ? null : id));

  const items: HistoryItem[] = [
    ...completedWorkouts.map((d) => ({ kind: 'strength' as const, data: d })),
    ...workoutRecords.map((d) => ({ kind: 'cardio' as const, data: d })),
  ].sort((a, b) => {
    const aTime = a.kind === 'strength' ? a.data.startTime : a.data.date;
    const bTime = b.kind === 'strength' ? b.data.startTime : b.data.date;
    return bTime.localeCompare(aTime);
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Workout History</Text>
        <View style={styles.headerButton} />
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={48} color={colors.textTertiary} />
          <Text style={styles.emptyText}>No workout history yet</Text>
          <Text style={styles.emptySubtext}>
            Complete a workout or sync your Garmin to see history here
          </Text>
        </View>
      ) : (
        // Dismiss open menu when tapping outside
        <Pressable style={{ flex: 1 }} onPress={() => setOpenMenuId(null)}>
          <FlatList
            data={items}
            keyExtractor={(item) => item.data.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              if (item.kind === 'strength') {
                const w = item.data;
                const menuId = `strength:${w.id}`;
                const isOpen = openMenuId === menuId;
                return (
                  <View>
                    <Pressable
                      style={styles.sessionCard}
                      onPress={() => { setOpenMenuId(null); setSummaryWorkout(w); }}
                    >
                      <View style={styles.cardHeader}>
                        <View style={[styles.iconWrap, { backgroundColor: colors.stress + '20' }]}>
                          <Ionicons name="barbell-outline" size={18} color={colors.stress} />
                        </View>
                        <View style={styles.cardTitleBlock}>
                          <Text style={styles.sessionName}>{w.name}</Text>
                          <Text style={styles.sessionDate}>{formatDate(w.startTime)}</Text>
                        </View>
                        <Pressable
                          onPress={(e) => { e.stopPropagation(); toggleMenu(menuId); }}
                          hitSlop={8}
                          style={styles.dotsButton}
                        >
                          <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} />
                        </Pressable>
                      </View>
                      <View style={styles.sessionStats}>
                        <View style={styles.stat}>
                          <Text style={styles.statValue}>{formatDuration(w.durationSeconds)}</Text>
                          <Text style={styles.statLabel}>Duration</Text>
                        </View>
                        <View style={styles.stat}>
                          <Text style={styles.statValue}>{Math.round(w.totalVolumeKg).toLocaleString()}</Text>
                          <Text style={styles.statLabel}>Volume (kg)</Text>
                        </View>
                        <View style={styles.stat}>
                          <Text style={styles.statValue}>{w.exercises.filter((e) => e.sets.some((s) => s.completedAt !== '')).length}</Text>
                          <Text style={styles.statLabel}>Exercises</Text>
                        </View>
                        {w.prCount > 0 && (
                          <View style={styles.stat}>
                            <View style={styles.prBadge}>
                              <Ionicons name="trophy" size={12} color={colors.bodyBattery} />
                              <Text style={styles.prValue}>{w.prCount}</Text>
                            </View>
                            <Text style={styles.statLabel}>PRs</Text>
                          </View>
                        )}
                      </View>
                    </Pressable>
                    {isOpen && (
                      <View style={styles.menu}>
                        <Pressable style={styles.menuItem} onPress={() => {
                          setOpenMenuId(null);
                          setRenameTarget({ kind: 'strength', id: w.id, name: w.name });
                          setRenameDraft(w.name);
                        }}>
                          <Ionicons name="pencil-outline" size={16} color={colors.textSecondary} />
                          <Text style={styles.menuText}>Edit Name</Text>
                        </Pressable>
                        <Pressable style={styles.menuItem} onPress={() => {
                          setOpenMenuId(null);
                          saveAsTemplate(w.name, w);
                        }}>
                          <Ionicons name="bookmark-outline" size={16} color={colors.textSecondary} />
                          <Text style={styles.menuText}>Save as Template</Text>
                        </Pressable>
                        <Pressable style={styles.menuItem} onPress={() => {
                          setOpenMenuId(null);
                          confirmDelete('Delete this workout from history?', () => deleteCompletedWorkout(w.id));
                        }}>
                          <Ionicons name="trash-outline" size={16} color={colors.error} />
                          <Text style={[styles.menuText, { color: colors.error }]}>Delete</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              }

              // Cardio / Garmin workout
              const w = item.data;
              const iconColor = WORKOUT_COLORS[w.activityType];
              const menuId = `cardio:${w.id}`;
              const isOpen = openMenuId === menuId;
              return (
                <View>
                  <View style={styles.sessionCard}>
                    <View style={styles.cardHeader}>
                      <View style={[styles.iconWrap, { backgroundColor: iconColor + '20' }]}>
                        <WorkoutIcon type={w.activityType} color={iconColor} />
                      </View>
                      <View style={styles.cardTitleBlock}>
                        <Text style={styles.sessionName}>{w.name}</Text>
                        <Text style={styles.sessionDate}>{format(parseISO(w.date), 'EEE, MMM d')}</Text>
                      </View>
                      <View style={styles.sourcePill}>
                        <Text style={styles.sourcePillText}>{w.source === 'garmin' ? 'Garmin' : w.source}</Text>
                      </View>
                      <Pressable
                        onPress={(e) => { e.stopPropagation(); toggleMenu(menuId); }}
                        hitSlop={8}
                        style={styles.dotsButton}
                      >
                        <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} />
                      </Pressable>
                    </View>
                    <View style={styles.sessionStats}>
                      <View style={styles.stat}>
                        <Text style={styles.statValue}>{w.durationMinutes}m</Text>
                        <Text style={styles.statLabel}>Duration</Text>
                      </View>
                      {w.distanceMeters != null && (
                        <View style={styles.stat}>
                          <Text style={styles.statValue}>{(w.distanceMeters / 1000).toFixed(1)}</Text>
                          <Text style={styles.statLabel}>km</Text>
                        </View>
                      )}
                      <View style={styles.stat}>
                        <Text style={styles.statValue}>{w.caloriesBurned}</Text>
                        <Text style={styles.statLabel}>kcal</Text>
                      </View>
                      {w.avgHeartRate != null && (
                        <View style={styles.stat}>
                          <View style={styles.hrRow}>
                            <Ionicons name="heart" size={11} color={colors.heart} />
                            <Text style={[styles.statValue, { color: colors.heart }]}>{w.avgHeartRate}</Text>
                          </View>
                          <Text style={styles.statLabel}>Avg HR</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {isOpen && (
                    <View style={styles.menu}>
                      <Pressable style={styles.menuItem} onPress={() => {
                        setOpenMenuId(null);
                        setRenameTarget({ kind: 'cardio', id: w.id, name: w.name });
                        setRenameDraft(w.name);
                      }}>
                        <Ionicons name="pencil-outline" size={16} color={colors.textSecondary} />
                        <Text style={styles.menuText}>Edit Name</Text>
                      </Pressable>
                      <Pressable style={styles.menuItem} onPress={() => {
                        setOpenMenuId(null);
                        confirmDelete('Delete this workout from history?', () => deleteWorkoutRecord(w.id));
                      }}>
                        <Ionicons name="trash-outline" size={16} color={colors.error} />
                        <Text style={[styles.menuText, { color: colors.error }]}>Delete</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            }}
          />
        </Pressable>
      )}

      {/* Rename modal */}
      <Modal visible={renameTarget !== null} transparent animationType="fade" onRequestClose={() => setRenameTarget(null)}>
        <Pressable style={styles.renameOverlay} onPress={() => setRenameTarget(null)}>
          <Pressable style={styles.renameCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.renameTitle}>Edit Name</Text>
            <TextInput
              style={styles.renameInput}
              value={renameDraft}
              onChangeText={setRenameDraft}
              placeholder="Workout name"
              placeholderTextColor={colors.textTertiary}
              autoFocus
              selectTextOnFocus
            />
            <View style={styles.renameActions}>
              <Pressable style={styles.renameCancelBtn} onPress={() => setRenameTarget(null)}>
                <Text style={styles.renameCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.renameSaveBtn, !renameDraft.trim() && styles.renameSaveDisabled]}
                onPress={() => {
                  if (!renameDraft.trim() || !renameTarget) return;
                  if (renameTarget.kind === 'strength') renameCompletedWorkout(renameTarget.id, renameDraft.trim());
                  else renameWorkoutRecord(renameTarget.id, renameDraft.trim());
                  setRenameTarget(null);
                }}
              >
                <Text style={styles.renameSaveText}>Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <WorkoutSummaryModal
        visible={summaryWorkout !== null}
        workout={summaryWorkout}
        allExercises={allExercises}
        onClose={() => setSummaryWorkout(null)}
        onSaveAsTemplate={(name) => saveAsTemplate(name, summaryWorkout!)}
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
    gap: spacing.md,
  },
  sessionCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleBlock: {
    flex: 1,
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
  dotsButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
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
  prBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  prValue: {
    ...typography.h3,
    color: colors.bodyBattery,
  },
  hrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  sourcePill: {
    backgroundColor: '#38BDF820',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  sourcePillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#38BDF8',
    letterSpacing: 0.3,
  },
  menu: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    padding: spacing.xs,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  menuText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  // Rename modal
  renameOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  renameCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    width: '100%',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  renameTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  renameInput: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  renameActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  renameCancelBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
  },
  renameCancelText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  renameSaveBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.activity,
  },
  renameSaveDisabled: {
    opacity: 0.4,
  },
  renameSaveText: {
    ...typography.body,
    color: '#000',
    fontWeight: '700',
  },
});
