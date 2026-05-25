# HANDOFF.md - Health Tracker App

## Overall Goal

Build a personal health tracker mobile app (React Native/Expo) that:
1. Merges data from multiple wearables (Garmin Forerunner 255, future Fitbit Air) into a unified dashboard
2. Includes a full-featured strength training workout planner (Strong app clone with templates, supersets, rest timers, PR tracking, pinned notes, exercise history)
3. Dark-themed card-based UI (Whoop/OURA style)
4. Runs on iPhone (web preview for development, native build later)
5. Local-first SQLite storage with optional Google Drive backup

See `PLAN.md` for full architecture details and phased implementation roadmap.

---

## Current State

**Phase 1 (Health Dashboard) — Complete.**
**Phase 3 (Workout Planner) — ~95% complete.**

The app runs on web (`npx expo start --web`) with mock data. All 5 health tabs are functional. The workout planner now has a complete exercise management system: create, edit, search-to-create, and replace exercises. PR detection using Epley 1RM runs on every set completion. A full workout summary modal appears immediately after finishing, showing duration, volume, PRs, and per-exercise set breakdown.

**No Apple Developer Account** — using web preview for UI development. Native iOS build deferred.

---

## What Has Succeeded

### Health Dashboard (Phase 1 - Complete)
- Expo project runs on web (`npx expo start --web`)
- Dark theme with card-based UI across all screens
- 5-tab navigation (Dashboard, Sleep, Activity, Heart, Workout)
- Time-based greeting (Good Morning/Afternoon/Evening/Night)
- Settings gear icon (top right) -> Settings page with back arrow (top left)
- Mock data with seeded pseudo-random for stable renders
- Source attribution badges on all metric cards (Garmin/Apple Health/Fitbit/Combined)
- 5-factor sleep scoring: Duration (20%), Bedtime (15%), Architecture (25%), Stress & Recovery (20%), Interruptions (20%)
- 7-day history charts on Sleep, Activity, and Heart tabs using computed scores
- Recovery card with unified "Readiness" metric
- Progress bars stay within card bounds
- All dependencies install successfully

### Workout Planner (Phase 3 - ~90% complete)
- Exercise picker with search and muscle group filter chips (ScrollView-based, not FlatList)
- Template creation/editing (name, exercises, target sets, rest time per exercise via +/-15s stepper, reorder, delete)
- **3 seed templates auto-loaded on first launch:** Push Day A, Pull Day A, Legs Day A (each with 5 exercises, correct rest times)
- Template preview modal (centered card, not full-screen) with exercise overview, start workout, edit
- Active workout screen (Strong-style):
  - Minimize button (chevron-down) to navigate away while workout continues
  - Timer persists based on startTime (recalculates on re-entry)
  - Workout title + 3-dot menu + notes placeholder
  - Per-exercise blocks: name, muscle/equipment label, progression icon, 3-dot menu
  - 3-dot menu: Add Note, Update Rest Timer, Add Warm-up Set, **Replace Exercise**, Remove Exercise
  - **Replace Exercise flow:** tap → navigates to exercise picker in `mode=replace` (single-tap select, no checkboxes) → swaps exercise in-place, loads new exercise's history, preserves rest time config
  - Notes with pin toggle (pinned = yellow banner, persists across sessions; unpinned = session-only)
  - Set table: SET | PREVIOUS | KG | REPS | checkmark
  - Set type picker (popup selector): Working/Warmup/Dropset/Failure with color coding
  - Working set numbering: always sequential (1, 2, 3...) based on working sets only
  - Warm-up set insertion: inserts after last warmup but before working sets
  - Rest time label between set rows showing configured duration
  - Per-set rest override via `restSeconds` field (null = use exercise default)
  - "Add Set" per exercise, "Add Exercises" button, "Cancel Workout" button
  - **Exercise history carry-over:** pre-seeded for 10 common exercises (Bench Press, Squat, Deadlift, OHP, Pull Up, Row, Curl, Tricep Pushdown, Lateral Raise, Leg Press). First time shows `—`, returning exercise auto-creates same number of sets with weight/reps pre-filled
  - **Rest timer progress bar** (inline): counts DOWN, full controls (−10s, Pause/Resume, Reset, +10s, Skip). Falls back to top banner when completely off-screen
  - Web-compatible confirm dialogs (window.confirm on web, Alert on native)
  - **PR detection:** `checkAndMarkPR(setId)` called on every set check-off. Uses Epley 1RM (`weight × (1 + reps/30)`) for fair cross-rep-range comparison. Marks `isPersonalRecord: true` on the set and updates `allTimeBest` if beaten. Trophy icon replaces set number in the table for PR sets
- **Workout summary modal:** shown immediately after confirming Finish. Header: name, date/time, duration, total volume, PR count with trophy. Per-exercise: best estimated 1RM. Per-set: weight × reps, 1RM value, trophy + amber text for PRs. Closing navigates back to workout tab
- Resume banner on Workout tab when session is active
- Starting from template pre-populates exercises with configured rest times
- **Exercise management (exercises screen):**
  - **Create exercise:** "+" button in header opens bottom-sheet modal (name, muscle group chips, equipment chips, optional instructions). Saved to `customExercises` in Zustand, immediately visible in list with purple "Custom" badge
  - **Search-to-create:** when search returns no results, a "Create '[search term]'" prompt appears with the name pre-filled in the modal
  - **Edit custom exercise:** pencil icon on each custom exercise row opens the same modal pre-filled. Saves via `updateCustomExercise`. Built-in exercises have no edit button
  - Edit and select icons have `gap: spacing.lg` + `padding + hitSlop: 12` to prevent mis-taps
  - Custom exercises appear in the lookup inside the active workout (fix: `allExercises` built from `[...builtInExercises, ...customExercises]` inside the component and passed as a prop — static module-level lookup was causing "Unknown" display)
- 40 pre-built exercises across all muscle groups

---

## What Didn't Work / Issues Encountered

| Issue | Resolution |
|-------|-----------|
| `react-native-health@^2.0.0` doesn't exist | Changed to `^1.18.0` |
| `expo-asset` missing at runtime | Installed via `npx expo install expo-asset` |
| `npx eas build` fails | Needs `npm install -g eas-cli` (deferred) |
| ProgressBar overflows cards in Activity tab | Wrapped in `flex: 1` container View |
| Horizontal FlatList for filter chips collapsed to 0 height | Replaced with ScrollView + `minHeight/maxHeight: 36` |
| Template preview modal covered full screen | Changed to transparent Modal with centered card (80% max height) |
| Alert.alert doesn't work on web | Added Platform check: `window.confirm` on web, native Alert elsewhere |
| Finish button not clickable | Was nested in a View blocking touches; made it a direct Pressable with larger padding |
| Can't navigate away during active workout | Added minimize (chevron-down) button; session state persists in Zustand |
| Rest timer was just a static banner | Rebuilt as inline progress bar with full controls (pause, +/-10s, reset, skip) |
| Progress bar counted UP instead of DOWN | Changed formula from elapsed/total to remaining/total |
| Progress bar rebounded on +/-10s | Fixed by NOT changing restTimerDuration in adjustRestTimer |
| Last set didn't start rest timer | Removed `index < sets.length - 1` condition |
| Top banner appeared when timer partially visible | Changed to only show when COMPLETELY off-screen using measureInWindow |
| Static rest label and active timer not aligned | Restructured both to use flex:1 sides with centered text at same position |
| Timer buttons too close together | Increased gap to `spacing.md`, added `minWidth: 36`, `paddingVertical: 8` |
| Set type cycling was error-prone | Replaced with popup picker showing all options with labels and colors |
| Warmup sets added at end | Created `insertSetAtBeginning` that inserts after last warmup, before working sets |
| Working set numbers wrong after adding warmups | Computed dynamically from position among working sets only |
| Custom exercises showed "Unknown" in active workout | `getExercise` was a module-level function only searching static JSON. Fixed by pulling `customExercises` from the store, building `allExercises = [...builtInExercises, ...customExercises]` in the component, and passing it as a prop to `ExerciseBlock` |
| VS Code "Cannot use JSX unless '--jsx' flag is provided" error | Created `.vscode/settings.json` with `"typescript.tsdk": "node_modules/typescript/lib"` to use workspace TypeScript instead of VS Code's built-in version |
| Workout summary modal never appeared after Finish | **Root cause:** Zustand `set()` is synchronous — `activeSession` became `null` before React's `setSummaryWorkout()` could apply, hitting the `if (!activeSession)` early return. **Fix:** moved `lastCompletedWorkout` into Zustand so `endSession` sets `activeSession: null` and `lastCompletedWorkout: completed` atomically in one `set()`. Component reads from store — both values ready on the same render |
| PR flag overwritten to `false` on finish | **Root cause:** `endSession` re-ran Epley detection against `allTimeBest` already updated by `checkAndMarkPR`. `96 > 96 = false` cleared the flag. **Fix:** `endSession` no longer re-runs detection — it trusts `isPersonalRecord` already set by `checkAndMarkPR`. Only `checkAndMarkPR` mutates `allTimeBest` |
| PR detection only compared weight×reps volume | Replaced with Epley 1RM (`weight × (1 + reps/30)`) so strength improvements are detected fairly across rep ranges |

---

## File Inventory

### Config (project root)
| File | Purpose |
|------|---------|
| `package.json` | Dependencies (Expo 52, Zustand, op-sqlite, victory-native, etc.) |
| `app.json` | Expo config (dark mode, HealthKit permissions, plugins) |
| `tsconfig.json` | TypeScript config with `@/*` path alias |
| `.vscode/settings.json` | Points VS Code to workspace TypeScript (fixes JSX error) |
| `PLAN.md` | Full implementation plan and architecture |
| `HANDOFF.md` | This file |
| `README.md` | Project overview, setup instructions, feature list, roadmap |

### Screens (`app/`)
| File | Purpose |
|------|---------|
| `app/_layout.tsx` | Root Stack layout (tabs + settings + workout routes) |
| `app/index.tsx` | Redirect to `/(tabs)/dashboard` |
| `app/(tabs)/_layout.tsx` | Bottom tab navigator (5 tabs) |
| `app/(tabs)/dashboard.tsx` | Main metric grid with greeting, settings gear (top right), Recovery, Sleep, Steps, HR, HRV, Readiness, Stress, Active Min, Calories |
| `app/(tabs)/sleep.tsx` | 5-factor sleep score breakdown + stages + 7-day history |
| `app/(tabs)/activity.tsx` | Steps, Active Minutes, Calories, Distance + 7-day history |
| `app/(tabs)/heart.tsx` | Resting HR, HRV, Readiness, Stress + 7-day histories |
| `app/(tabs)/workout.tsx` | Workout home: start empty, resume active, templates (tap for preview modal), history link. Seed templates loaded here on first mount via `useEffect` |
| `app/settings/_layout.tsx` | Settings stack layout |
| `app/settings/index.tsx` | Data source connections, goals, preferences (back arrow top left) |
| `app/workout/_layout.tsx` | Workout stack layout |
| `app/workout/active.tsx` | Active workout session. Receives `allExercises` built from builtIn + custom for exercise name lookup. 3-dot menu includes Replace Exercise |
| `app/workout/exercises.tsx` | Exercise picker. Modes: `pick` (multi-select), `replace` (single-tap). Has create modal (reused for edit), search-to-create empty state, pencil edit button on custom exercises |
| `app/workout/template.tsx` | Template editor (create/edit, add exercises, sets/rest config with +/-15s stepper) |
| `app/workout/history.tsx` | Workout history (empty state, ready for data) |

### Components (`src/components/`)
| File | Purpose |
|------|---------|
| `src/components/ui/Card.tsx` | Dark card container with border |
| `src/components/ui/ProgressBar.tsx` | Animated progress bar |
| `src/components/ui/SourceBadge.tsx` | Colored badge showing data source |
| `src/components/cards/MetricCard.tsx` | Reusable metric card (icon, value, progress, trend, source) |
| `src/components/cards/RecoveryCard.tsx` | Full-width recovery score card |
| `src/components/workout/TemplatePreviewModal.tsx` | Centered modal showing template overview + start/edit |
| `src/components/workout/WorkoutSummaryModal.tsx` | Post-workout summary modal: duration, volume, PR count, per-exercise sets with Epley 1RM, trophy icons on PR sets |

### State Management (`src/stores/`)
| File | Purpose |
|------|---------|
| `src/stores/healthStore.ts` | Today's health metrics + history arrays (auto-loads mock on web) |
| `src/stores/workoutStore.ts` | Active session, exercises, sets, templates, `customExercises`, rest timer, pinned notes, exercise history (pre-seeded for 10 exercises), `allTimeBest` (Epley 1RM per exercise), `completedWorkouts`, `lastCompletedWorkout`. Actions: `checkAndMarkPR`, `endSession` (atomic — sets `lastCompletedWorkout` in same call as `activeSession: null`), `clearLastCompletedWorkout`, `addCustomExercise`, `updateCustomExercise`, `replaceExerciseInSession` |
| `src/stores/exercisePickerStore.ts` | Temporary selection state + `replaceTargetId` for replace flow |
| `src/stores/settingsStore.ts` | Connection states, goals, unit preferences |

### Database (`src/db/`)
| File | Purpose |
|------|---------|
| `src/db/schema.ts` | SQLite CREATE TABLE statements (health + workout tables) |
| `src/db/database.ts` | DB singleton (open, init, close) using op-sqlite |
| `src/db/repository.ts` | Health data CRUD with source-priority queries |
| `src/db/workoutRepository.ts` | Workout CRUD (exercises, templates, sessions, sets, PR detection) |

### Models (`src/models/`)
| File | Purpose |
|------|---------|
| `common.ts` | `DataSource` type, `MetricRecord` base interface |
| `sleep.ts` | `SleepRecord` (stages, score, duration) |
| `activity.ts` | `DailyActivity`, `WorkoutRecord` |
| `heart.ts` | `DailyHeartMetrics` (HR, HRV, stress, readiness) |
| `recovery.ts` | `DailyRecovery` (computed score) |
| `workout.ts` | `Exercise`, `WorkoutTemplate`, `WorkoutSession`, `WorkoutSet`, `MuscleGroup`, `Equipment`, `SetType` |

### Services (`src/services/`)
| File | Purpose |
|------|---------|
| `src/services/appleHealth/healthKit.ts` | Apple HealthKit init, permissions, data fetching |
| `src/services/dataMerge/priorities.ts` | Source priority config per metric type |
| `src/services/dataMerge/deduplicator.ts` | Time-overlap detection, dedup utility |

### Utils / Data / Theme
| File | Purpose |
|------|---------|
| `src/utils/sleepScoring.ts` | 5-factor sleep score algorithm |
| `src/data/exercises.json` | Pre-built exercise library (40 exercises, all muscle groups) |
| `src/data/mockData.ts` | Mock health data + seeded weekly history generator |
| `src/theme/colors.ts` | Dark palette (background, surfaces, metric accents) |
| `src/theme/spacing.ts` | Spacing scale (xs through xxxl) + border radii |
| `src/theme/typography.ts` | Font styles (h1-h3, body, caption, metric) |

---

## Key Store State (`workoutStore.ts`)

```typescript
interface WorkoutState {
  activeSession: WorkoutSession | null;
  activeExercises: ActiveExercise[];       // exerciseId, notes, notesPinned, restSeconds
  activeSets: WorkoutSet[];
  templates: WorkoutTemplate[];
  customExercises: Exercise[];             // user-created, persists in Zustand
  pinnedNotes: Record<string, string>;     // exerciseId -> persistent note
  exerciseHistory: Record<string, {        // exerciseId -> last session's sets (pre-seeded for 10 exercises)
    weight: number | null;
    reps: number | null;
    type: SetType;
  }[]>;
  restTimerEnd: number | null;
  restTimerDuration: number;
  restTimerPaused: boolean;
  restTimerPausedRemaining: number | null;
  restTimerSetId: string | null;
}
```

Key behaviors:
- `endSession()` saves completed sets into `exerciseHistory` before clearing active state
- `addExerciseToSession()` loads pinned notes and creates sets from history (or 1 empty set)
- `replaceExerciseInSession()` swaps exercise in-place, loads new exercise's history, preserves rest time
- `insertSetAtBeginning()` places warmup sets after existing warmups but before working sets
- `toggleExerciseNotePin()` toggles between session-only and persistent notes
- `addCustomExercise()` / `updateCustomExercise()` manage user-created exercises
- Working set numbers computed dynamically at render time (not stored)

---

## Exact Next Steps

### Immediate (Phase 3 completion)

1. **Populate workout history screen** — `completedWorkouts` is already in the store. Wire `app/workout/history.tsx` to list them: date, duration, total volume, exercise count. Tap to expand (can reuse `WorkoutSummaryModal` or a similar read-only layout).

2. **Pre-populate sets from template** — When starting from a template, create `max(template.targetSets, historySetCount)` set rows per exercise. Currently only history count is used (defaults to 1 if no history).

3. **Expand exercise library** — Go from 40 to 200+ exercises in `src/data/exercises.json`.

4. **Superset support** — Allow grouping exercises in the template editor and active workout (shared rest timer between superset exercises).

5. **Zustand persistence** — Add `zustand/middleware` persist with AsyncStorage so `pinnedNotes`, `exerciseHistory`, `allTimeBest`, `templates`, `customExercises`, and `completedWorkouts` survive app restarts. Currently everything resets on page refresh — this is the most impactful remaining item.

### Phase 2: Garmin API Integration

8. **Cloudflare Worker** — Deploy `functions/garmin-token-exchange.ts` for OAuth 1.0a token exchange.

9. **Garmin OAuth flow** — In-app OAuth: open browser → authorize → callback → store tokens in expo-secure-store.

10. **Garmin data fetch** — Pull Body Battery, stress, detailed sleep stages, HRV from Garmin Connect API.

11. **Data normalizer** — Map Garmin responses to unified models, run deduplication against existing records.

12. **HR overlay on workouts** — After completing a workout, fetch Garmin HR data for that time range and display avg/max HR.

### Phase 4: Sync & Polish

13. **Google Drive backup/restore** — Google Sign-In + Drive `appDataFolder` for JSON export/import.

14. **Trend charts** — Use `victory-native` for 7/30-day line charts on detail screens.

15. **Computed Recovery Score** — Combine HRV + RHR + sleep quality into a daily recovery score.

16. **Onboarding wizard** — First-launch flow to connect data sources and set goals.

### Phase 5: Native Build

17. **EAS Build for iOS** — Requires Apple Developer account ($99/year):
    ```bash
    npm install -g eas-cli
    eas login
    eas build:configure
    eas build --profile development --platform ios
    ```

---

## Development Commands

```bash
# Start web preview
npx expo start --web

# Type check
npx tsc --noEmit

# Install new packages (Expo-compatible versions)
npx expo install <package-name>

# Fix dependency versions for current SDK
npx expo install --fix
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| "Readiness" not "Body Battery" | Unified metric: Garmin Body Battery + Fitbit Readiness + Google Readiness |
| Source badges everywhere | User wants to see where each data point comes from |
| 5-factor sleep scoring | Combines Apple Health approach (duration, bedtime, interruptions) with Garmin approach (architecture, stress/recovery) |
| Mock data on web only | `Platform.OS === 'web'` check auto-loads sample data for dev |
| Source priority system | Sleep/HR: Garmin > Fitbit > Apple Health. Steps: Apple Health > Garmin > Fitbit |
| Default rest timer: 120s (2 min) | User specified 2 minutes as default |
| Rest timer as progress bar | Inline with controls: +/-10s, pause/resume, reset, skip |
| Rest time between sets | Static label showing configured time; interactive timer appears when active |
| Per-set rest override | Each set has optional `restSeconds`; null falls back to exercise default |
| Template preview modal (not full-screen) | Centered card on dark overlay, dismiss by tapping outside |
| Active workout persists on navigation | Zustand state survives route changes; chevron-down minimizes, resume banner brings it back |
| Web-compatible dialogs | `window.confirm` on web, native `Alert` on iOS/Android |
| Strong-style active workout | Pinned notes (yellow), set type picker, previous performance column, progression icon, 3-dot menu per exercise |
| Notes: pinned vs session | Pin icon toggles persistence; pinned = all future workouts, unpinned = this session only |
| Exercise history carry-over | Last session's sets auto-populate weight/reps and determine set count |
| Working set numbers | Computed dynamically from position among working sets (1, 2, 3...), ignoring warmups/drops/failures |
| Warmup set insertion | Inserts after existing warmups, before first working set |
| Set type selection | Popup picker (not cycling) to prevent accidental type changes |
| Custom exercise lookup must use store | `getExercise` must never be a static module-level function — custom exercises live in Zustand, so lookup must use `[...builtInExercises, ...customExercises]` built inside the component |
| Replace exercise via picker store | `replaceTargetId` stored in `exercisePickerStore` before navigating to picker; cleared after swap so normal "add" flow still works |
| Edit vs select button spacing | `gap: spacing.lg` + `padding` + `hitSlop: 12` on pencil button to prevent mis-taps |
| Weight unit: kg | Stored in settings store |
| SQLite via op-sqlite | Fast, offline-first, works with Expo dev client |
| No Apple Developer account yet | All development via web preview; native build deferred |
