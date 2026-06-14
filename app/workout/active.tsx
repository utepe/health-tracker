import { useState, useEffect, useRef } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';
import { useWorkoutStore, ActiveExercise } from '../../src/stores/workoutStore';
import { useExercisePickerStore } from '../../src/stores/exercisePickerStore';
import { Exercise, WorkoutSet, SetType } from '../../src/models/workout';
import { WorkoutSummaryModal } from '../../src/components/workout/WorkoutSummaryModal';
import exercisesData from '../../src/data/exercises.json';

const builtInExercises = exercisesData as Exercise[];

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const {
    activeSession,
    activeExercises,
    activeSets,
    customExercises,
    lastCompletedWorkout,
    clearLastCompletedWorkout,
    addSet,
    insertSetAtBeginning,
    updateSet,
    removeSet,
    addExerciseToSession,
    removeExerciseFromSession,
    replaceExerciseInSession,
    updateExerciseNotes,
    toggleExerciseNotePin,
    updateExerciseRest,
    exerciseHistory,
    checkAndMarkPR,
    endSession,
    cancelSession,
    setSessionName,
    setSessionNotes,
    sessionNotes,
    saveAsTemplate,
    updateTemplateFromWorkout,
    restTimerEnd,
    restTimerDuration,
    restTimerPaused,
    restTimerPausedRemaining,
    restTimerSetId,
    startRestTimer,
    adjustRestTimer,
    pauseRestTimer,
    resumeRestTimer,
    resetRestTimer,
    clearRestTimer,
  } = useWorkoutStore();

  const { selectedIds, clear: clearPicker, replaceTargetId, clearReplaceTarget } = useExercisePickerStore();
  const { width: screenWidth } = useWindowDimensions();
  // Scale factor: 1.0 at 390px (iPhone 14), grows on wider screens, capped at 1.6 for desktop
  const scale = Math.min(1.6, Math.max(1.0, screenWidth / 390));
  const [elapsed, setElapsed] = useState(0);
  const [restRemaining, setRestRemaining] = useState(0);
  const [inlineTimerVisible, setInlineTimerVisible] = useState(true);
  const [showShortWorkoutModal, setShowShortWorkoutModal] = useState(false);
  const [showWorkoutMenu, setShowWorkoutMenu] = useState(false);
  const titleInputRef = useRef<TextInput>(null);
  const notesInputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const inlineTimerRef = useRef<View>(null);
  const headerHeight = useRef(0);
  const startTimeRef = useRef(Date.now());

  // Pick up exercises from picker when returning
  useEffect(() => {
    if (selectedIds.length > 0) {
      if (replaceTargetId) {
        replaceExerciseInSession(replaceTargetId, selectedIds[0]);
        clearReplaceTarget();
      } else {
        selectedIds.forEach((id) => addExerciseToSession(id));
      }
      clearPicker();
    }
  }, [selectedIds]);

  // Workout timer
  useEffect(() => {
    if (!activeSession) return;
    startTimeRef.current = new Date(activeSession.startTime).getTime();
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  // Rest timer
  useEffect(() => {
    if (!restTimerEnd) {
      setRestRemaining(0);
      return;
    }
    const interval = setInterval(() => {
      const remaining = restTimerEnd - Date.now();
      if (remaining <= 0) {
        clearRestTimer();
        setRestRemaining(0);
      } else {
        setRestRemaining(remaining);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [restTimerEnd]);

  const handleFinishWorkout = () => {
    const elapsedMinutes = elapsed / 60000;
    if (elapsedMinutes < 5) {
      setShowShortWorkoutModal(true);
      return;
    }
    const completedSets = activeSets.filter((s) => s.completedAt !== '');
    if (Platform.OS === 'web') {
      if (window.confirm(`Finish workout with ${completedSets.length} set${completedSets.length !== 1 ? 's' : ''}?`)) {
        endSession();
      }
    } else {
      const { Alert } = require('react-native');
      Alert.alert(
        'Finish Workout',
        `Complete workout with ${completedSets.length} set${completedSets.length !== 1 ? 's' : ''}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Finish', onPress: () => endSession() },
        ]
      );
    }
  };

  const handleCancelWorkout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Discard workout? All progress will be lost.')) {
        cancelSession();
        router.back();
      }
    } else {
      const { Alert } = require('react-native');
      Alert.alert(
        'Discard Workout',
        'Are you sure? All progress will be lost.',
        [
          { text: 'Keep Going', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => { cancelSession(); router.back(); } },
        ]
      );
    }
  };

  if (!activeSession) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No active workout</Text>
          <Pressable style={styles.goBackButton} onPress={() => router.back()}>
            <Text style={styles.goBackText}>Go Back</Text>
          </Pressable>
        </View>
        <WorkoutSummaryModal
          visible={lastCompletedWorkout !== null}
          workout={lastCompletedWorkout}
          allExercises={[...builtInExercises, ...customExercises]}
          onClose={() => { clearLastCompletedWorkout(); router.back(); }}
          onUpdateTemplate={lastCompletedWorkout?.templateId ? () => updateTemplateFromWorkout(lastCompletedWorkout.templateId!, lastCompletedWorkout) : undefined}
          onSaveAsTemplate={!lastCompletedWorkout?.templateId ? (name) => saveAsTemplate(name, lastCompletedWorkout!) : undefined}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header bar */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.minimizeButton}>
          <Ionicons name="chevron-down" size={24} color={colors.textSecondary} />
        </Pressable>
        <Pressable onPress={() => startRestTimer(120)} style={styles.timerButton}>
          <Ionicons name="timer-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.timerText}>{formatDuration(elapsed)}</Text>
        </Pressable>
        <Pressable onPress={handleFinishWorkout} style={styles.finishButton}>
          <Text style={styles.finishText}>Finish</Text>
        </Pressable>
      </View>

      {/* Rest Timer Bar (fallback when inline timer is scrolled off-screen) */}
      {(restRemaining > 0 || restTimerPaused) && !inlineTimerVisible && (
        <View style={styles.restBanner}>
          {/* Progress bar counting down (starts full, shrinks to 0) */}
          <View style={styles.restProgressBg}>
            <View
              style={[
                styles.restProgressFill,
                {
                  width: `${Math.min(100, Math.max(0, ((restTimerPaused ? (restTimerPausedRemaining ?? 0) : restRemaining) / (restTimerDuration * 1000)) * 100))}%`,
                },
              ]}
            />
          </View>
          {/* Timer controls */}
          <View style={styles.restControls}>
            <Pressable onPress={() => adjustRestTimer(-10)} style={styles.restControlBtn}>
              <Text style={styles.restControlBtnText}>-10s</Text>
            </Pressable>
            <Pressable onPress={restTimerPaused ? resumeRestTimer : pauseRestTimer} style={styles.restControlBtn}>
              <Ionicons name={restTimerPaused ? 'play' : 'pause'} size={16} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.restTimerValue}>
              {formatDuration(restTimerPaused ? (restTimerPausedRemaining ?? 0) : restRemaining)}
            </Text>
            <Pressable onPress={resetRestTimer} style={styles.restControlBtn}>
              <Ionicons name="refresh" size={16} color={colors.textSecondary} />
            </Pressable>
            <Pressable onPress={() => adjustRestTimer(10)} style={styles.restControlBtn}>
              <Text style={styles.restControlBtnText}>+10s</Text>
            </Pressable>
            <Pressable onPress={clearRestTimer} style={styles.restSkipBtn}>
              <Text style={styles.restSkipText}>Skip</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Workout Content */}
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={() => {
          // Use measureInWindow to check if the inline timer is completely off-screen
          if (inlineTimerRef.current) {
            const node = inlineTimerRef.current as any;
            if (Platform.OS === 'web' && node.measure) {
              node.measure((_x: number, _y: number, _w: number, h: number, _px: number, pageY: number) => {
                const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
                const completelyOffScreen = (pageY + h < 0) || (pageY > windowHeight);
                setInlineTimerVisible(!completelyOffScreen);
              });
            } else if (node.measureInWindow) {
              node.measureInWindow((_x: number, y: number, _w: number, h: number) => {
                const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
                const completelyOffScreen = (y + h < 0) || (y > windowHeight);
                setInlineTimerVisible(!completelyOffScreen);
              });
            }
          }
        }}
        scrollEventThrottle={100}
      >
        {/* Workout Title + Notes */}
        <View style={styles.workoutHeader}>
          <View style={styles.workoutTitleRow}>
            <TextInput
              ref={titleInputRef}
              style={styles.workoutTitle}
              value={activeSession.name}
              onChangeText={setSessionName}
              placeholder="Workout name"
              placeholderTextColor={colors.textTertiary}
              returnKeyType="done"
            />
            <Pressable style={styles.iconBtn} onPress={() => setShowWorkoutMenu((v) => !v)}>
              <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>
          {showWorkoutMenu && (
            <View style={styles.workoutMenu}>
              <Pressable style={styles.workoutMenuItem} onPress={() => { setShowWorkoutMenu(false); titleInputRef.current?.focus(); }}>
                <Ionicons name="pencil-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.workoutMenuText}>Edit Name</Text>
              </Pressable>
              <Pressable style={styles.workoutMenuItem} onPress={() => { setShowWorkoutMenu(false); notesInputRef.current?.focus(); }}>
                <Ionicons name="document-text-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.workoutMenuText}>Add Notes</Text>
              </Pressable>
            </View>
          )}
          <Pressable onPress={() => notesInputRef.current?.focus()}>
            <TextInput
              ref={notesInputRef}
              style={styles.workoutNotes}
              value={sessionNotes}
              onChangeText={setSessionNotes}
              placeholder="Notes"
              placeholderTextColor={colors.textTertiary}
              multiline
              pointerEvents="none"
            />
          </Pressable>
        </View>

        {/* Exercise Blocks */}
        {activeExercises.map((activeExercise) => (
          <ExerciseBlock
            key={activeExercise.exerciseId}
            activeExercise={activeExercise}
            allExercises={[...builtInExercises, ...customExercises]}
            sets={activeSets.filter((s) => s.exerciseId === activeExercise.exerciseId)}
            history={exerciseHistory[activeExercise.exerciseId] ?? null}
            sessionId={activeSession.id}
            restTimerSetId={restTimerSetId}
            restTimerActive={restRemaining > 0 || restTimerPaused}
            restRemaining={restRemaining}
            restTimerDuration={restTimerDuration}
            restTimerPaused={restTimerPaused}
            restTimerPausedRemaining={restTimerPausedRemaining}
            onAdjustRest={adjustRestTimer}
            onPauseRest={pauseRestTimer}
            onResumeRest={resumeRestTimer}
            onResetRest={resetRestTimer}
            onSkipRest={clearRestTimer}
            inlineTimerRef={inlineTimerRef}
            onAddSet={(newSet) => addSet(newSet)}
            onInsertWarmup={(newSet) => insertSetAtBeginning(newSet)}
            onUpdateSet={updateSet}
            onRemoveSet={removeSet}
            onUpdateNotes={(notes) => updateExerciseNotes(activeExercise.exerciseId, notes)}
            onTogglePin={() => toggleExerciseNotePin(activeExercise.exerciseId)}
            onUpdateRest={(seconds) => updateExerciseRest(activeExercise.exerciseId, seconds)}
            onRemoveExercise={() => removeExerciseFromSession(activeExercise.exerciseId)}
            onReplaceExercise={() => {
              useExercisePickerStore.getState().setReplaceTarget(activeExercise.exerciseId);
              router.push('/workout/exercises?mode=replace');
            }}
            onStartRest={(setId: string) => {
              checkAndMarkPR(setId);
              startRestTimer(activeExercise.restSeconds, setId);
            }}
            scale={scale}
          />
        ))}

        {/* Add Exercises Button */}
        <Pressable
          style={styles.addExerciseButton}
          onPress={() => router.push('/workout/exercises?mode=pick')}
        >
          <Text style={styles.addExerciseText}>Add Exercises</Text>
        </Pressable>

        {/* Cancel Workout Button */}
        <Pressable style={styles.cancelButton} onPress={handleCancelWorkout}>
          <Text style={styles.cancelButtonText}>Cancel Workout</Text>
        </Pressable>

        <View style={{ height: 60 }} />
      </ScrollView>
      {/* Short workout modal — shown when finishing before 5 minutes */}
      <Modal visible={showShortWorkoutModal} transparent animationType="fade" onRequestClose={() => setShowShortWorkoutModal(false)}>
        <Pressable style={styles.shortWorkoutOverlay} onPress={() => setShowShortWorkoutModal(false)}>
          <Pressable style={styles.shortWorkoutCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.shortWorkoutTitle}>Short Workout</Text>
            <Text style={styles.shortWorkoutBody}>
              This workout is only {formatDuration(elapsed)} long. What would you like to do?
            </Text>
            <Pressable style={styles.shortWorkoutFinish} onPress={() => { setShowShortWorkoutModal(false); endSession(); }}>
              <Text style={styles.shortWorkoutFinishText}>Finish Workout</Text>
            </Pressable>
            <Pressable style={styles.shortWorkoutCancel} onPress={() => {
              setShowShortWorkoutModal(false);
              cancelSession();
              router.back();
            }}>
              <Text style={styles.shortWorkoutCancelText}>Cancel Workout</Text>
            </Pressable>
            <Pressable style={styles.shortWorkoutKeepGoing} onPress={() => setShowShortWorkoutModal(false)}>
              <Text style={styles.shortWorkoutKeepGoingText}>Keep Going</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <WorkoutSummaryModal
        visible={lastCompletedWorkout !== null}
        workout={lastCompletedWorkout}
        allExercises={[...builtInExercises, ...customExercises]}
        onClose={() => { clearLastCompletedWorkout(); router.back(); }}
      />
    </SafeAreaView>
  );
}

function formatRestTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m}:00` : `${m}:${s.toString().padStart(2, '0')}`;
}

// --- Exercise Block (Strong-style) ---
function ExerciseBlock({
  activeExercise,
  allExercises,
  sets,
  history,
  sessionId,
  restTimerSetId,
  restTimerActive,
  restRemaining,
  restTimerDuration,
  restTimerPaused,
  restTimerPausedRemaining,
  onAdjustRest,
  onPauseRest,
  onResumeRest,
  onResetRest,
  onSkipRest,
  inlineTimerRef,
  onAddSet,
  onInsertWarmup,
  onUpdateSet,
  onRemoveSet,
  onUpdateNotes,
  onTogglePin,
  onUpdateRest,
  onRemoveExercise,
  onReplaceExercise,
  onStartRest,
  scale,
}: {
  activeExercise: ActiveExercise;
  allExercises: Exercise[];
  sets: WorkoutSet[];
  history: { weight: number | null; reps: number | null; type: SetType }[] | null;
  sessionId: string;
  restTimerSetId: string | null;
  restTimerActive: boolean;
  restRemaining: number;
  restTimerDuration: number;
  restTimerPaused: boolean;
  restTimerPausedRemaining: number | null;
  onAdjustRest: (delta: number) => void;
  onPauseRest: () => void;
  onResumeRest: () => void;
  onResetRest: () => void;
  onSkipRest: () => void;
  inlineTimerRef: React.RefObject<any>;
  onAddSet: (set: WorkoutSet) => void;
  onInsertWarmup: (set: WorkoutSet) => void;
  onUpdateSet: (id: string, updates: Partial<WorkoutSet>) => void;
  onRemoveSet: (id: string) => void;
  onUpdateNotes: (notes: string) => void;
  onTogglePin: () => void;
  onUpdateRest: (seconds: number) => void;
  onRemoveExercise: () => void;
  onReplaceExercise: () => void;
  onStartRest: (setId: string) => void;
  scale: number;
}) {
  const [showNotes, setShowNotes] = useState(activeExercise.notes.length > 0 || activeExercise.notesPinned);
  const [showMenu, setShowMenu] = useState(false);
  const [showRestEdit, setShowRestEdit] = useState(false);
  const exercise = allExercises.find((e) => e.id === activeExercise.exerciseId);

  const handleAddSet = () => {
    const setNumber = sets.length + 1;
    const newSet: WorkoutSet = {
      id: `set_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      sessionId,
      exerciseId: activeExercise.exerciseId,
      setNumber,
      type: 'working',
      weight: null,
      reps: null,
      rpe: null,
      durationSeconds: null,
      restSeconds: null,
      isPersonalRecord: false,
      completedAt: '',
    };
    onAddSet(newSet);
  };

  return (
    <View style={styles.exerciseBlock}>
      {/* Exercise Header */}
      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseTitleRow}>
          <Text style={styles.exerciseName}>{exercise?.name ?? 'Unknown'}</Text>
          <View style={styles.exerciseActions}>
            <Pressable onPress={() => {/* TODO: show progression/history */}} style={styles.iconBtn}>
              <Ionicons name="trending-up" size={18} color={colors.textSecondary} />
            </Pressable>
            <Pressable onPress={() => setShowMenu(!showMenu)} style={styles.iconBtn}>
              <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>
        {exercise && (
          <Text style={styles.exerciseMuscle}>
            {exercise.muscleGroup.charAt(0).toUpperCase() + exercise.muscleGroup.slice(1)}
            {exercise.equipment !== 'bodyweight' ? ` • ${exercise.equipment}` : ''}
          </Text>
        )}
      </View>

      {/* Dropdown Menu */}
      {showMenu && (
        <View style={styles.menu}>
          <Pressable
            style={styles.menuItem}
            onPress={() => { setShowNotes(!showNotes); setShowMenu(false); }}
          >
            <Ionicons name="document-text-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.menuText}>{showNotes ? 'Hide Notes' : 'Add Note'}</Text>
          </Pressable>
          <Pressable
            style={styles.menuItem}
            onPress={() => { setShowRestEdit(!showRestEdit); setShowMenu(false); }}
          >
            <Ionicons name="timer-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.menuText}>Update Rest Timer</Text>
          </Pressable>
          <Pressable
            style={styles.menuItem}
            onPress={() => {
              // Add a warmup set at the beginning
              const warmupSet: WorkoutSet = {
                id: `set_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                sessionId,
                exerciseId: activeExercise.exerciseId,
                setNumber: 0,
                type: 'warmup',
                weight: null,
                reps: null,
                rpe: null,
                durationSeconds: null,
                restSeconds: null,
                isPersonalRecord: false,
                completedAt: '',
              };
              onInsertWarmup(warmupSet);
              setShowMenu(false);
            }}
          >
            <Ionicons name="arrow-up-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.menuText}>Add Warm-up Set</Text>
          </Pressable>
          <Pressable
            style={styles.menuItem}
            onPress={() => { onReplaceExercise(); setShowMenu(false); }}
          >
            <Ionicons name="swap-horizontal-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.menuText}>Replace Exercise</Text>
          </Pressable>
          <Pressable
            style={styles.menuItem}
            onPress={() => { onRemoveExercise(); setShowMenu(false); }}
          >
            <Ionicons name="trash-outline" size={16} color={colors.error} />
            <Text style={[styles.menuText, { color: colors.error }]}>Remove Exercise</Text>
          </Pressable>
        </View>
      )}

      {/* Rest Timer Editor */}
      {showRestEdit && (
        <View style={styles.restEditContainer}>
          <Text style={styles.restEditLabel}>Rest Timer</Text>
          <View style={styles.restEditRow}>
            <Pressable
              onPress={() => onUpdateRest(Math.max(15, activeExercise.restSeconds - 15))}
              style={styles.restEditBtn}
            >
              <Ionicons name="remove" size={18} color={colors.textSecondary} />
            </Pressable>
            <Text style={styles.restEditValue}>{formatRestTime(activeExercise.restSeconds)}</Text>
            <Pressable
              onPress={() => onUpdateRest(activeExercise.restSeconds + 15)}
              style={styles.restEditBtn}
            >
              <Ionicons name="add" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>
      )}

      {/* Note banner — yellow if pinned, subtle if not */}
      {showNotes && (
        <View style={[
          styles.pinnedNoteContainer,
          activeExercise.notesPinned && styles.pinnedNoteContainerActive,
        ]}>
          <TextInput
            style={styles.pinnedNoteInput}
            value={activeExercise.notes}
            onChangeText={onUpdateNotes}
            placeholder={activeExercise.notesPinned
              ? "Pinned note (persists across workouts)..."
              : "Session note (this workout only)..."}
            placeholderTextColor={colors.textTertiary}
            multiline
          />
          <Pressable onPress={onTogglePin} hitSlop={8} style={styles.pinButton}>
            <MaterialIcons
              name="push-pin"
              size={16}
              color={activeExercise.notesPinned ? colors.warning : colors.textTertiary}
            />
          </Pressable>
        </View>
      )}

      {/* Set Table Header */}
      {(() => {
        const hColSet = Math.round(32 * scale);
        const hColWeight = Math.round(64 * scale);
        const hColReps = Math.round(56 * scale);
        const hColCheck = Math.round(36 * scale);
        return (
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colSet, { width: hColSet }]}>SET</Text>
            <Text style={[styles.tableHeaderText, styles.colPrev]}>PREVIOUS</Text>
            <Text style={[styles.tableHeaderText, styles.colWeight, { width: hColWeight }]}>KG</Text>
            <Text style={[styles.tableHeaderText, styles.colReps, { width: hColReps }]}>REPS</Text>
            <View style={[styles.colCheck, { width: hColCheck }]} />
          </View>
        );
      })()}

      {/* Set Rows with rest time after each set */}
      {sets.map((set, index) => {
        const isSetCompleted = set.completedAt !== '';
        const isTimerForThisSet = restTimerSetId === set.id && restTimerActive;
        const prevSet = history && index < history.length ? history[index] : null;
        const prevText = prevSet && (prevSet.weight !== null || prevSet.reps !== null)
          ? `${prevSet.weight ?? 0} × ${prevSet.reps ?? 0}`
          : '—';
        // Compute working set number: count only working sets up to and including this one
        const workingSetNumber = set.type === 'working'
          ? sets.slice(0, index + 1).filter((s) => s.type === 'working').length
          : 0;
        return (
          <View key={set.id}>
            <SetRow
              set={set}
              workingSetNumber={workingSetNumber}
              previousText={prevText}
              onUpdate={(updates) => onUpdateSet(set.id, updates)}
              onRemove={() => onRemoveSet(set.id)}
              onComplete={() => onStartRest(set.id)}
              scale={scale}
            />
            {/* Rest: active timer OR static label */}
            {isTimerForThisSet ? (
              <View ref={inlineTimerRef} style={styles.inlineRestTimer}>
                <View style={styles.inlineRestProgressBg}>
                  <View
                    style={[
                      styles.inlineRestProgressFill,
                      {
                        width: `${Math.min(100, Math.max(0, ((restTimerPaused ? (restTimerPausedRemaining ?? 0) : restRemaining) / (restTimerDuration * 1000)) * 100))}%`,
                      },
                    ]}
                  />
                </View>
                <View style={styles.inlineRestControls}>
                  {/* Left buttons */}
                  <View style={[styles.inlineRestSide, { justifyContent: 'flex-end' }]}>
                    <Pressable onPress={() => onAdjustRest(-10)} style={styles.inlineRestBtn}>
                      <Text style={styles.inlineRestBtnText}>-10s</Text>
                    </Pressable>
                    <Pressable onPress={restTimerPaused ? onResumeRest : onPauseRest} style={styles.inlineRestBtn}>
                      <Ionicons name={restTimerPaused ? 'play' : 'pause'} size={14} color={colors.textPrimary} />
                    </Pressable>
                  </View>
                  {/* Centered countdown */}
                  <Text style={styles.inlineRestTime}>
                    {formatDuration(restTimerPaused ? (restTimerPausedRemaining ?? 0) : restRemaining)}
                  </Text>
                  {/* Right buttons — mirror left side for symmetric layout */}
                  <View style={[styles.inlineRestSide, { justifyContent: 'flex-start' }]}>
                    <Pressable onPress={onResetRest} style={styles.inlineRestBtn}>
                      <Ionicons name="refresh" size={14} color={colors.textSecondary} />
                    </Pressable>
                    <Pressable onPress={() => onAdjustRest(10)} style={styles.inlineRestBtn}>
                      <Text style={styles.inlineRestBtnText}>+10s</Text>
                    </Pressable>
                  </View>
                </View>
                {/* Skip on its own centered row so it doesn't break symmetry */}
                <Pressable onPress={onSkipRest} style={styles.inlineRestSkipRow}>
                  <Text style={styles.inlineRestSkipText}>Skip</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.restIndicator}>
                <View style={[styles.restIndicatorLine, { backgroundColor: isSetCompleted ? colors.activity : colors.textTertiary }]} />
                <Text style={[styles.restIndicatorText, { color: isSetCompleted ? colors.activity : colors.textTertiary }]}>
                  {formatRestTime(set.restSeconds ?? activeExercise.restSeconds)}
                </Text>
                <View style={[styles.restIndicatorLine, { backgroundColor: isSetCompleted ? colors.activity : colors.textTertiary }]} />
              </View>
            )}
          </View>
        );
      })}

      {/* Add Set (with rest time) */}
      <Pressable style={styles.addSetButton} onPress={handleAddSet}>
        <Ionicons name="add" size={18} color={colors.textSecondary} />
        <Text style={styles.addSetText}>Add Set ({formatRestTime(activeExercise.restSeconds)})</Text>
      </Pressable>
    </View>
  );
}

// --- Set Row ---
function SetRow({
  set,
  workingSetNumber,
  previousText,
  onUpdate,
  onRemove,
  onComplete,
  scale,
}: {
  set: WorkoutSet;
  workingSetNumber: number;
  previousText: string;
  onUpdate: (updates: Partial<WorkoutSet>) => void;
  onRemove: () => void;
  onComplete: () => void;
  scale: number;
}) {
  const [weight, setWeight] = useState(set.weight?.toString() ?? '');
  const [reps, setReps] = useState(set.reps?.toString() ?? '');
  const [completed, setCompleted] = useState(set.completedAt !== '');
  const [showTypePicker, setShowTypePicker] = useState(false);

  const handleCheck = () => {
    if (completed) {
      setCompleted(false);
      onUpdate({ completedAt: '' });
      return;
    }
    const w = weight ? parseFloat(weight) : null;
    const r = reps ? parseInt(reps, 10) : null;
    onUpdate({ weight: w, reps: r, completedAt: new Date().toISOString() });
    setCompleted(true);
    onComplete();
  };

  const typeLabels: Record<SetType, string> = {
    working: `${workingSetNumber}`,
    warmup: 'W',
    dropset: 'D',
    failure: 'F',
  };

  const typeFullLabels: Record<SetType, string> = {
    working: 'Working Set',
    warmup: 'Warm-up Set',
    dropset: 'Drop Set',
    failure: 'Failure Set',
  };

  const typeColors: Record<SetType, string> = {
    working: colors.textSecondary,
    warmup: colors.warning,
    dropset: colors.info,
    failure: colors.error,
  };

  const allTypes: SetType[] = ['working', 'warmup', 'dropset', 'failure'];

  const colSetW = Math.round(32 * scale);
  const colWeightW = Math.round(64 * scale);
  const colRepsW = Math.round(56 * scale);
  const colCheckW = Math.round(36 * scale);
  const inputFontSize = Math.round(15 * scale);
  const prevFontSize = Math.round(14 * scale);

  return (
    <View>
      <View style={[styles.setRow, completed && styles.setRowCompleted]}>
        {/* Set number / type */}
        <Pressable onPress={() => setShowTypePicker(!showTypePicker)} style={[styles.colSet, { width: colSetW }]}>
          {set.isPersonalRecord ? (
            <Ionicons name="trophy" size={14} color={colors.warning} />
          ) : (
            <Text style={[styles.setLabel, { color: typeColors[set.type] }]}>
              {typeLabels[set.type]}
            </Text>
          )}
        </Pressable>

      {/* Previous */}
      <Text style={[styles.prevText, styles.colPrev, { fontSize: prevFontSize }]} numberOfLines={1}>{previousText}</Text>

      {/* Weight Input */}
      <TextInput
        style={[styles.setInput, styles.colWeight, { width: colWeightW, fontSize: inputFontSize }, completed && styles.setInputCompleted]}
        value={weight}
        onChangeText={setWeight}
        keyboardType="decimal-pad"
        placeholder="—"
        placeholderTextColor={colors.textTertiary}
      />

      {/* Reps Input */}
      <TextInput
        style={[styles.setInput, styles.colReps, { width: colRepsW, fontSize: inputFontSize }, completed && styles.setInputCompleted]}
        value={reps}
        onChangeText={setReps}
        keyboardType="number-pad"
        placeholder="—"
        placeholderTextColor={colors.textTertiary}
      />

      {/* Checkmark */}
      <Pressable
        style={[styles.checkButton, completed && styles.checkButtonDone, { width: colCheckW, height: colCheckW, borderRadius: Math.round(colCheckW / 2) }]}
        onPress={handleCheck}
      >
        <Ionicons
          name="checkmark"
          size={16}
          color={completed ? colors.background : colors.textTertiary}
        />
      </Pressable>
      </View>

      {/* Set Type Picker */}
      {showTypePicker && (
        <View style={styles.typePickerContainer}>
          {allTypes.map((type) => (
            <Pressable
              key={type}
              style={[
                styles.typePickerOption,
                set.type === type && styles.typePickerOptionActive,
              ]}
              onPress={() => {
                onUpdate({ type });
                setShowTypePicker(false);
              }}
            >
              <Text style={[styles.typePickerLabel, { color: typeColors[type] }]}>
                {typeLabels[type]}
              </Text>
              <Text style={[
                styles.typePickerText,
                set.type === type && styles.typePickerTextActive,
              ]}>
                {typeFullLabels[type]}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  minimizeButton: {
    padding: spacing.sm,
  },
  timerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  timerText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  finishButton: {
    backgroundColor: colors.activity,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  finishText: {
    fontSize: 14,
    color: colors.background,
    fontWeight: '700',
  },
  // Rest Timer
  restBanner: {
    backgroundColor: colors.surfaceElevated,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  restProgressBg: {
    height: 4,
    backgroundColor: colors.progressBackground,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  restProgressFill: {
    height: '100%',
    backgroundColor: colors.info,
    borderRadius: 2,
  },
  restControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  restControlBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restControlBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  restTimerValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    minWidth: 60,
    textAlign: 'center',
  },
  restSkipBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.activity,
  },
  restSkipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.background,
  },
  // Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  // Workout Header
  workoutHeader: {
    marginBottom: spacing.xl,
  },
  workoutTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  workoutTitle: {
    ...typography.h1,
    color: colors.textPrimary,
    flex: 1,
  },
  workoutNotes: {
    ...typography.body,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  workoutMenu: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    padding: spacing.xs,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  workoutMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  workoutMenuText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  // Exercise Block
  exerciseBlock: {
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  exerciseHeader: {
    marginBottom: spacing.sm,
  },
  exerciseTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseName: {
    ...typography.body,
    color: colors.activity,
    fontWeight: '700',
    fontSize: 16,
    flex: 1,
  },
  exerciseActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  iconBtn: {
    padding: spacing.xs,
  },
  exerciseMuscle: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
  },
  // Menu
  menu: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    padding: spacing.xs,
    marginBottom: spacing.sm,
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
  // Pinned Note
  pinnedNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 6,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.textTertiary,
  },
  pinnedNoteContainerActive: {
    backgroundColor: 'rgba(255, 179, 71, 0.12)',
    borderLeftColor: colors.warning,
  },
  pinnedNoteInput: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    flex: 1,
    padding: 0,
    minHeight: 20,
  },
  pinButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  // Rest Editor
  restEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  restEditLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  restEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  restEditBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restEditValue: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    minWidth: 50,
    textAlign: 'center',
  },
  // Rest Indicator between sets (static)
  restIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  restIndicatorLine: {
    flex: 1,
    height: 1,
  },
  restIndicatorText: {
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    minWidth: 50,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  // Inline Rest Timer (between sets, active)
  inlineRestTimer: {
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  inlineRestProgressBg: {
    height: 3,
    backgroundColor: colors.progressBackground,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  inlineRestProgressFill: {
    height: '100%',
    backgroundColor: colors.info,
    borderRadius: 2,
  },
  inlineRestControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineRestSide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  inlineRestBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
  },
  inlineRestBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  inlineRestTime: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    minWidth: 50,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  inlineRestSkipBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.activity,
    minWidth: 36,
  },
  inlineRestSkipRow: {
    alignSelf: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xl,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.activity,
  },
  inlineRestSkipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.background,
    textAlign: 'center',
  },
  // Table
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Column widths — must fit on a 375px iPhone screen
  // SET(32) + PREV(flex1.2) + KG(flex1) + REPS(flex1) + CHECK(36) + margins ≈ fits
  colSet: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colPrev: {
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  colWeight: {
    width: 64,
    marginHorizontal: 4,
  },
  colReps: {
    width: 56,
    marginHorizontal: 4,
  },
  colCheck: {
    width: 36,
    alignItems: 'center',
  },
  // Set Row
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 2,
  },
  setRowCompleted: {
    backgroundColor: 'rgba(74, 222, 128, 0.08)',
  },
  setLabel: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  prevText: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  setInput: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
    textAlign: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 6,
    paddingVertical: 7,
    paddingHorizontal: 2,
  },
  setInputCompleted: {
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
  },
  checkButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.textTertiary,
    marginLeft: 4,
  },
  checkButtonDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  // Set Type Picker
  typePickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  typePickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typePickerOptionActive: {
    borderColor: colors.activity,
    backgroundColor: 'rgba(74, 222, 128, 0.08)',
  },
  typePickerLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  typePickerText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  typePickerTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  // Add Set
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
    borderRadius: 6,
    backgroundColor: colors.surfaceElevated,
  },
  addSetText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  // Add Exercise
  addExerciseButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.activity,
  },
  addExerciseText: {
    ...typography.body,
    color: colors.activity,
    fontWeight: '600',
  },
  // Cancel Workout
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 8,
    marginTop: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.error,
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.error,
    fontWeight: '600',
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textTertiary,
  },
  goBackButton: {
    backgroundColor: colors.activity,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  goBackText: {
    ...typography.body,
    color: colors.background,
    fontWeight: '600',
  },
  shortWorkoutOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  shortWorkoutCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    width: '100%',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shortWorkoutTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  shortWorkoutBody: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  shortWorkoutFinish: {
    backgroundColor: colors.activity,
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  shortWorkoutFinishText: {
    ...typography.body,
    color: '#000',
    fontWeight: '700',
  },
  shortWorkoutCancel: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error,
  },
  shortWorkoutCancelText: {
    ...typography.body,
    color: colors.error,
    fontWeight: '600',
  },
  shortWorkoutKeepGoing: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  shortWorkoutKeepGoingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
