# Health Tracker

A personal health tracking mobile app built with React Native/Expo. Merges data from multiple wearables (Garmin Forerunner 255, future Fitbit Air) into a unified dashboard and includes a full-featured strength training workout planner.

**Current status:** Phase 1 (Health Dashboard) complete. Phase 3 (Workout Planner) ~90% complete. Running on web preview — native iOS build deferred pending Apple Developer account.

---

## Features

### Health Dashboard
- 5-tab navigation: Dashboard, Sleep, Activity, Heart, Workout
- Dark-themed card-based UI (Whoop/OURA style)
- Time-based greeting (Morning / Afternoon / Evening / Night)
- Source attribution badges on every metric (Garmin / Apple Health / Fitbit / Combined)
- Unified **Readiness** metric combining Body Battery, HRV, RHR, and sleep quality
- **5-factor sleep scoring:** Duration (20%), Bedtime (15%), Architecture (25%), Stress & Recovery (20%), Interruptions (20%)
- 7-day history charts on Sleep, Activity, and Heart tabs
- Mock data with seeded pseudo-random values for stable development renders

### Workout Planner (Strong-style)
- Exercise library with search and muscle group filter chips (40 built-in exercises; 200+ planned)
- **Custom exercises:** create via "+" button (name, muscle group, equipment, instructions), edit via pencil icon, "Custom" badge in list
- **Search-to-create:** searching for a non-existent exercise shows a "Create '[name]'" prompt with the name pre-filled
- 3 seed templates on first launch: Push Day A, Pull Day A, Legs Day A
- Template CRUD: create/edit with per-exercise target sets, rest time (+/-15s stepper), reorder, delete
- Template preview modal: overview card with Start / Edit actions
- **Active workout screen:**
  - Strong-style set table: SET | PREVIOUS | KG | REPS | ✓
  - Exercise history carry-over (auto-fills weight/reps from last session; pre-seeded for 10 common exercises)
  - Set type picker (popup): Working / Warmup / Dropset / Failure with color coding
  - Working set numbers computed dynamically (1, 2, 3… ignoring warmup/drop/failure sets)
  - Warmup sets inserted after existing warmups, before first working set
  - Pinned notes (yellow banner, persists across sessions) vs. session-only notes
  - Per-exercise 3-dot menu: Add Note, Update Rest Timer, Add Warm-up Set, **Replace Exercise**, Remove Exercise
  - **Inline rest timer progress bar** with: -10s, Pause/Resume, Reset, +10s, Skip controls
  - Falls back to top-of-screen banner only when timer is completely off-screen
  - Minimize (chevron-down) to navigate away; session persists in Zustand
  - Resume banner on Workout tab when a session is active
  - Web-compatible confirm dialogs (`window.confirm` on web, `Alert` on native)
- Workout history screen (shell; data wiring in progress)

---

## Tech Stack

| Layer | Library | Version |
|-------|---------|---------|
| Framework | Expo (managed) | ~52.0.0 |
| Navigation | expo-router | ~4.0.0 |
| State | Zustand | ^5.0.0 |
| Database | @op-engineering/op-sqlite | ^9.0.0 |
| Charts | victory-native + @shopify/react-native-skia | ^41.0.0 / 1.5.0 |
| Health | react-native-health (HealthKit) | ^1.18.0 |
| Auth (planned) | expo-auth-session + expo-secure-store | — / ~14.0.0 |
| Cloud Sync (planned) | Google Drive REST API | — |
| Backend (planned) | Cloudflare Worker (Garmin OAuth 1.0a) | — |
| Build (planned) | EAS Build | — |

---

## Project Structure

```
health-tracker/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root Stack layout
│   ├── index.tsx                 # Redirect → /(tabs)/dashboard
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Bottom tab navigator (5 tabs)
│   │   ├── dashboard.tsx         # Main metric grid + Recovery card
│   │   ├── sleep.tsx             # Sleep score breakdown + 7-day history
│   │   ├── activity.tsx          # Steps, calories, distance + 7-day history
│   │   ├── heart.tsx             # HR, HRV, Readiness, Stress + histories
│   │   └── workout.tsx           # Workout home (templates, resume banner)
│   ├── workout/
│   │   ├── active.tsx            # Active workout session
│   │   ├── exercises.tsx         # Exercise picker with search + filter
│   │   ├── template.tsx          # Template editor (create/edit)
│   │   └── history.tsx           # Workout history
│   └── settings/
│       └── index.tsx             # Data source connections + preferences
├── src/
│   ├── components/
│   │   ├── cards/                # MetricCard, RecoveryCard
│   │   ├── ui/                   # Card, ProgressBar, SourceBadge
│   │   └── workout/              # TemplatePreviewModal
│   ├── stores/
│   │   ├── healthStore.ts        # Today's health metrics + history
│   │   ├── workoutStore.ts       # Active session, sets, templates, customExercises, rest timer, pinned notes, exercise history
│   │   ├── exercisePickerStore.ts # Temporary selection state + replaceTargetId between screens
│   │   └── settingsStore.ts      # Connections, goals, unit preferences
│   ├── db/
│   │   ├── schema.ts             # SQLite table definitions
│   │   ├── database.ts           # DB singleton (op-sqlite)
│   │   ├── repository.ts         # Health data CRUD
│   │   └── workoutRepository.ts  # Workout CRUD + PR detection
│   ├── models/                   # TypeScript interfaces (sleep, activity, heart, workout…)
│   ├── services/
│   │   ├── appleHealth/          # HealthKit init, permissions, data fetch
│   │   └── dataMerge/            # Source priority config + deduplication logic
│   ├── data/
│   │   ├── exercises.json        # Exercise library (40 exercises, all muscle groups)
│   │   └── mockData.ts           # Mock health data + seeded history generator
│   ├── hooks/
│   │   └── useHealthData.ts
│   ├── theme/                    # colors.ts, spacing.ts, typography.ts
│   └── utils/
│       └── sleepScoring.ts       # 5-factor sleep score algorithm
├── PLAN.md                       # Full architecture + phased roadmap
├── HANDOFF.md                    # Current state, issues log, exact next steps
├── app.json                      # Expo config (dark mode, HealthKit permissions)
└── package.json
```

---

## Data Architecture

### Multi-source merge priority

| Metric | Primary | Fallback | Reason |
|--------|---------|----------|--------|
| Sleep stages | Garmin API | Apple HealthKit | Garmin has best staging |
| Steps | Apple HealthKit | Garmin | HealthKit deduplicates multiple sources |
| Resting HR / HRV | Garmin API | Apple HealthKit | Garmin wrist sensor consistency |
| Body Battery / Stress | Garmin API | — | Garmin-exclusive |
| Workouts (strength) | This app | Garmin | Set/rep detail only in this app |

Deduplication uses a 5-minute time-window tolerance. All records are stored; the highest-priority source is displayed.

### Key data models

```typescript
type DataSource = 'garmin' | 'apple_health' | 'fitbit';

interface SleepRecord { source: DataSource; date: string; durationMinutes: number;
  deepMinutes: number; lightMinutes: number; remMinutes: number; sleepScore: number | null; }

interface WorkoutSet { setNumber: number; type: 'working' | 'warmup' | 'dropset' | 'failure';
  weight: number | null; reps: number | null; rpe: number | null;
  isPersonalRecord: boolean; restSeconds: number | null; }
```

---

## Development

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)

### Running the app

```bash
# Install dependencies
npm install

# Start web preview (primary dev environment)
npx expo start --web
# or
npm run web

# Type check
npx tsc --noEmit

# Install Expo-compatible package versions
npx expo install <package-name>

# Fix dependency versions for current SDK
npx expo install --fix
```

> All UI development uses web preview. HealthKit and Garmin integrations require a physical iPhone with Expo Dev Client.

### Native iOS build (requires Apple Developer account)

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --profile development --platform ios
```

---

## Roadmap

### Phase 3 — Workout Planner (in progress, ~90%)
- [x] Exercise picker with search, filter, and muscle group chips
- [x] Template CRUD with per-exercise rest time config
- [x] Active workout screen (set logging, rest timer, set types, pinned notes)
- [x] Exercise history carry-over with pre-seeded data
- [x] Replace exercise from 3-dot menu
- [x] Create custom exercises (name, muscle group, equipment, instructions)
- [x] Edit custom exercises
- [x] Search-to-create prompt when no results found
- [ ] PR detection (compare weight×reps to all-time best, show trophy icon)
- [ ] Persist completed workouts to `completedWorkouts` in store
- [ ] Wire workout history screen with date, duration, volume, exercise count
- [ ] Pre-populate sets from template target (`max(template.targetSets, historySetCount)`)
- [ ] Expand exercise library to 200+ exercises
- [ ] Superset support (shared rest timer between grouped exercises)
- [ ] Zustand persist middleware (AsyncStorage) for notes, history, templates, custom exercises

### Phase 2 — Garmin API
- [ ] Deploy Cloudflare Worker for OAuth 1.0a token exchange
- [ ] In-app Garmin OAuth flow → tokens stored in expo-secure-store
- [ ] Fetch Body Battery, stress, detailed sleep stages, HRV from Garmin Connect API
- [ ] Data normalizer mapping Garmin responses to unified models
- [ ] HR overlay on completed workouts (Garmin HR for workout time range)

### Phase 4 — Sync & Polish
- [ ] Google Sign-In + Drive `appDataFolder` backup/restore
- [ ] 7/30-day trend charts using victory-native
- [ ] Computed Recovery Score (HRV + RHR + sleep quality)
- [ ] Onboarding wizard

### Phase 5 — Future
- [ ] Fitbit Air integration via Google Health Connect
- [ ] iOS lock screen + home screen widgets
- [ ] Workout sharing / program import
- [ ] Auto-progression suggestions
- [ ] TestFlight distribution via EAS Build

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| "Readiness" not "Body Battery" | Unified metric across Garmin Body Battery, Fitbit Readiness, Google Readiness |
| Source badges on all metrics | User wants to see where each data point originates |
| 5-factor sleep scoring | Blends Apple Health approach (duration, bedtime, interruptions) with Garmin approach (architecture, stress/recovery) |
| Mock data on web only | `Platform.OS === 'web'` check auto-loads sample data during development |
| Default rest timer: 120s | 2 minutes specified as default; configurable per exercise |
| Rest timer as inline progress bar | Full controls (±10s, pause/resume, reset, skip) without leaving the set table |
| Per-set rest override | Each set has optional `restSeconds`; null falls back to exercise default |
| Active workout persists on navigation | Zustand state survives route changes; chevron-down minimizes, resume banner brings it back |
| Warmup set insertion order | Inserted after existing warmups, before first working set |
| Working set numbers computed at render | Not stored; derived from position among working sets only |
| Custom exercise lookup uses store | `allExercises` built from `[...builtInExercises, ...customExercises]` inside the component — static module-level lookup would miss Zustand-stored custom exercises |
| Replace exercise via picker store | `replaceTargetId` stored in `exercisePickerStore` before navigating; cleared after swap so normal add flow still works |
| SQLite via op-sqlite | Fast, offline-first, compatible with Expo Dev Client |
