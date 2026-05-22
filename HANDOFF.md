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

**Phase 1 is complete. Phase 3 (Workout Planner) is ~85% complete.**

The app runs on web (`npx expo start --web`) with mock data. All 5 health tabs are functional with source badges, 7-day histories, and a 5-factor sleep scoring system. The workout planner has: exercise picker with search/filter, template CRUD with per-exercise rest time config, active workout screen (Strong-style with set logging, inline rest timer progress bar with pause/resume/+10s/-10s/reset/skip controls, pinned/session notes, exercise notes, set type picker, exercise history carry-over), template preview modal, and workout history shell.

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

### Workout Planner (Phase 3 - In Progress)
- Exercise picker with search and muscle group filter chips (ScrollView-based, not FlatList)
- Template creation/editing (name, exercises, target sets, rest time per exercise via +/-15s stepper, reorder, delete)
- Template preview modal (centered card, not full-screen) with exercise overview, start workout, edit
- Active workout screen (Strong-style):
  - Minimize button (chevron-down) to navigate away while workout continues
  - Timer persists based on startTime (recalculates on re-entry)
  - Workout title + 3-dot menu + notes placeholder
  - Per-exercise blocks: name, muscle/equipment label, progression icon, 3-dot menu
  - 3-dot menu: Add Note, Update Rest Timer (inline editor), Add Warm-up Set, Remove Exercise
  - **Notes with pin toggle:**
    - Unpinned (outline icon, subtle card) = session-only note, visible in workout history
    - Pinned (filled yellow icon, yellow banner) = persists across all future workouts for that exercise
    - Pin state toggleable via tap on pin icon
  - Set table: SET | PREVIOUS | KG | REPS | checkmark
  - **Set type picker** (popup selector instead of cycling): Working/Warmup/Dropset/Failure with color coding
  - **Working set numbering**: always sequential (1, 2, 3...) based on working sets only, unaffected by warmup/drop/failure sets
  - **Warm-up set insertion**: inserts after last warmup but before working sets (not at end)
  - Rest time label between set rows showing configured duration
  - Per-set rest override via `restSeconds` field (null = use exercise default)
  - "Add Set" per exercise, "Add Exercises" button, "Cancel Workout" button
  - **Exercise history carry-over:**
    - First time: defaults to 1 empty set
    - Returning exercise: auto-creates same number of sets as last session with weight/reps pre-filled
    - PREVIOUS column shows last session's data per set (e.g. "60 x 5")
  - **Rest timer progress bar** (inline, appears after completing a set):
    - Progress bar counting DOWN (remaining/total ratio, fixed denominator)
    - Left side: -10s button, Pause/Resume button
    - Center: countdown timer text (horizontally aligned with static rest label)
    - Right side: Reset button, +10s button, Skip button
    - Buttons spaced with `gap: spacing.md` and `minWidth: 36` for usability
    - Falls back to top-of-screen banner ONLY when inline timer is completely off-screen
  - Web-compatible confirm dialogs (window.confirm on web, Alert on native)
- Resume banner on Workout tab when session is active
- Starting from template pre-populates exercises with configured rest times
- Exercise picker store for passing selections between screens
- 40 pre-built exercises across all muscle groups
- Exercise history saved on workout completion (endSession saves to exerciseHistory)

---

## What Failed / Issues Encountered

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

---

## File Inventory

### Config (project root)
| File | Purpose |
|------|---------|
| `package.json` | Dependencies (Expo 52, Zustand, op-sqlite, victory-native, etc.) |
| `app.json` | Expo config (dark mode, HealthKit permissions, plugins) |
| `tsconfig.json` | TypeScript config with `@/*` path alias |
| `PLAN.md` | Full implementation plan and architecture |
| `HANDOFF.md` | This file |

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
| `app/(tabs)/workout.tsx` | Workout home: start empty, resume active, templates (tap for preview modal), history link |
| `app/settings/_layout.tsx` | Settings stack layout |
| `app/settings/index.tsx` | Data source connections, goals, preferences (back arrow top left) |
| `app/workout/_layout.tsx` | Workout stack layout |
| `app/workout/active.tsx` | Active workout session (Strong-style UI with rest timer, set type picker, history carry-over) |
| `app/workout/exercises.tsx` | Exercise picker with search + muscle group filter chips |
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

### State Management (`src/stores/`)
| File | Purpose |
|------|---------|
| `src/stores/healthStore.ts` | Today's health metrics + history arrays (auto-loads mock on web) |
| `src/stores/workoutStore.ts` | Active session, exercises, sets, templates, rest timer, pinned notes, exercise history |
| `src/stores/exercisePickerStore.ts` | Temporary selection state for passing exercises between screens |
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
| `workout.ts` | `Exercise`, `WorkoutTemplate`, `WorkoutSession`, `WorkoutSet` (with `restSeconds` per-set override), `MuscleGroup`, `Equipment`, `SetType` |

### Services (`src/services/`)
| File | Purpose |
|------|---------|
| `src/services/appleHealth/healthKit.ts` | Apple HealthKit init, permissions, data fetching |
| `src/services/dataMerge/priorities.ts` | Source priority config per metric type |
| `src/services/dataMerge/deduplicator.ts` | Time-overlap detection, dedup utility |

### Utils (`src/utils/`)
| File | Purpose |
|------|---------|
| `src/utils/sleepScoring.ts` | 5-factor sleep score (Duration, Bedtime, Architecture, Stress/Recovery, Interruptions) |

### Data (`src/data/`)
| File | Purpose |
|------|---------|
| `src/data/exercises.json` | Pre-built exercise library (40 exercises, all muscle groups) |
| `src/data/mockData.ts` | Mock health data + seeded weekly history generator |

### Theme (`src/theme/`)
| File | Purpose |
|------|---------|
| `colors.ts` | Dark palette (background, surfaces, metric accents) |
| `spacing.ts` | Spacing scale (xs through xxxl) + border radii |
| `typography.ts` | Font styles (h1-h3, body, caption, metric) |

---

## Key Store State (`workoutStore.ts`)

```typescript
interface WorkoutState {
  activeSession: WorkoutSession | null;
  activeExercises: ActiveExercise[];       // exerciseId, notes, notesPinned, restSeconds
  activeSets: WorkoutSet[];
  templates: WorkoutTemplate[];
  pinnedNotes: Record<string, string>;     // exerciseId -> persistent note (survives across sessions)
  exerciseHistory: Record<string, {        // exerciseId -> last session's sets
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
- `insertSetAtBeginning()` places warmup sets after existing warmups but before working sets
- `toggleExerciseNotePin()` toggles between session-only and persistent notes
- Working set numbers computed dynamically at render time (not stored)

---

## Exact Next Steps

### Immediate (Phase 3 completion)

1. **PR detection** — When a set is completed, compare weight x reps to the exercise's all-time best stored in `exerciseHistory`. If it's a new PR, flag `isPersonalRecord: true` and show a visual indicator (trophy icon on the set row).

2. **Persist completed workouts** — When "Finish" is tapped, save the full session + sets to a `completedWorkouts` array in the store. Currently `endSession()` only saves per-exercise history (last sets), not the full workout record with date/duration/volume.

3. **Populate workout history screen** — Wire completed workouts into `app/workout/history.tsx` with date, duration, total volume (weight x reps sum), exercise count per session.

4. **Pre-populate sets from template** — When starting from a template, auto-create the target number of set rows per exercise (currently only adds exercises; sets come from history or default to 1). Should use `max(template.targetSets, historySetCount)`.

5. **Expand exercise library** — Go from 40 to 200+ exercises in `exercises.json`.

6. **Superset support** — Allow grouping exercises in the template editor and active workout (shared rest timer between superset exercises).

7. **Zustand persistence** — Add `zustand/middleware` persist with AsyncStorage so `pinnedNotes`, `exerciseHistory`, `templates`, and `completedWorkouts` survive app restarts.

### Phase 2: Garmin API Integration

8. **Cloudflare Worker** — Deploy `functions/garmin-token-exchange.ts` for OAuth 1.0a token exchange.

9. **Garmin OAuth flow** — In-app OAuth: open browser -> authorize -> callback -> store tokens in expo-secure-store.

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

# Future: iOS build
npm install -g eas-cli
eas build --profile development --platform ios
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
| Weight unit: kg | Stored in settings store |
| SQLite via op-sqlite | Fast, offline-first, works with Expo dev client |
| No Apple Developer account yet | All development via web preview; native build deferred |
