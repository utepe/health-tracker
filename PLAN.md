# Health Tracker App - Implementation Plan

## Context

Build a personal health tracker app (React Native/Expo) that merges data from multiple wearables (Garmin Forerunner 255, future Fitbit Air) into a unified dashboard. Also includes a full-featured strength training workout planner (Strong app clone). The app is dark-themed with card-based UI (Whoop/OURA style), runs on iPhone, stores data locally with optional Google Drive sync.

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Expo (managed) + React Native | Simplified native access, familiar for web devs |
| Navigation | expo-router | File-based routing, web-dev friendly |
| State | Zustand | Minimal boilerplate, simple |
| Database | op-sqlite (SQLite) | Fast, offline-first, relational for workout data |
| Charts | victory-native + react-native-skia | Best-looking charts |
| Health | react-native-health (HealthKit) | Most mature iOS health library |
| Auth | expo-auth-session + expo-secure-store | OAuth flows + secure token storage |
| Cloud Sync | Google Drive REST API | User pays for Google One |
| Backend | Cloudflare Worker (free tier) | Only for Garmin OAuth 1.0a token exchange |
| Build | EAS Build | Cloud builds, TestFlight distribution |

---

## Project Structure

```
health-tracker/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout (theme, fonts)
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Tab navigator
│   │   ├── dashboard.tsx         # Main metrics grid
│   │   ├── sleep.tsx             # Sleep detail + trends
│   │   ├── activity.tsx          # Steps/calories/workouts
│   │   ├── heart.tsx             # HR, HRV, stress, Body Battery
│   │   └── workout.tsx           # Workout planner home
│   ├── workout/
│   │   ├── active.tsx            # Active workout session screen
│   │   ├── history.tsx           # Workout history
│   │   ├── template/[id].tsx     # Edit/view template
│   │   └── exercise/[id].tsx     # Exercise detail + history
│   ├── settings/
│   │   ├── index.tsx
│   │   ├── connections.tsx       # Garmin/HealthKit/Fitbit setup
│   │   └── sync.tsx              # Google Drive sync
│   └── onboarding/
│       └── index.tsx
├── src/
│   ├── components/
│   │   ├── cards/                # MetricCard, SleepCard, etc.
│   │   ├── charts/              # MiniLineChart, ProgressRing, BarChart
│   │   ├── workout/             # ExerciseRow, SetInput, RestTimer, TemplateCard
│   │   └── ui/                  # Card, ProgressBar, Badge, Button
│   ├── stores/
│   │   ├── healthStore.ts
│   │   ├── workoutStore.ts      # Active workout state
│   │   └── settingsStore.ts
│   ├── services/
│   │   ├── garmin/              # OAuth + API calls
│   │   ├── appleHealth/         # HealthKit queries
│   │   ├── googleDrive/         # Backup/restore
│   │   └── dataMerge/           # Normalizer, deduplicator, priorities
│   ├── db/
│   │   ├── schema.ts            # All table definitions
│   │   ├── migrations/
│   │   ├── repository.ts        # Health data access
│   │   └── workoutRepository.ts # Workout/exercise data access
│   ├── data/
│   │   └── exercises.json       # Pre-built exercise library (200+)
│   ├── models/                  # TypeScript interfaces
│   ├── hooks/
│   ├── theme/                   # Dark theme colors, spacing, typography
│   └── utils/
├── functions/                   # Cloudflare Worker
│   └── garmin-token-exchange.ts
├── app.json
├── eas.json
└── package.json
```

---

## Data Model

### Health Metrics (unified from multiple sources)

```typescript
type DataSource = 'garmin' | 'apple_health' | 'fitbit';

// Each record tracks its source for deduplication
interface SleepRecord {
  id: string; source: DataSource; date: string;
  startTime: string; endTime: string; durationMinutes: number;
  deepMinutes: number; lightMinutes: number; remMinutes: number;
  awakeMinutes: number; sleepScore: number | null;
}

interface DailyActivity {
  id: string; source: DataSource; date: string;
  steps: number; activeMinutes: number;
  caloriesTotal: number; caloriesActive: number;
  distanceMeters: number;
}

interface DailyHeartMetrics {
  id: string; source: DataSource; date: string;
  restingHR: number | null; hrvAvg: number | null;
  stressScore: number | null; bodyBattery: number | null;
}
```

### Workout Tracker (Strong-style)

```typescript
interface Exercise {
  id: string;
  name: string;
  muscleGroup: 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'core' | 'cardio';
  secondaryMuscles: string[];
  equipment: 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight' | 'other';
  instructions: string;
  isCustom: boolean;
}

interface WorkoutTemplate {
  id: string;
  name: string;              // e.g. "Push Day A"
  exercises: TemplateExercise[];
  lastPerformed: string | null;
}

interface TemplateExercise {
  exerciseId: string;
  order: number;
  sets: number;             // Target number of sets
  supersetGroup: string | null;  // Group ID for supersets
  restSeconds: number;
}

interface WorkoutSession {
  id: string;
  templateId: string | null;
  startTime: string;
  endTime: string | null;
  status: 'active' | 'completed' | 'cancelled';
  sets: WorkoutSet[];
  avgHeartRate: number | null;   // From Garmin sync
  caloriesBurned: number | null;
}

interface WorkoutSet {
  id: string;
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  type: 'working' | 'warmup' | 'dropset' | 'failure';
  weight: number | null;    // kg
  reps: number | null;
  rpe: number | null;       // Rate of perceived exertion 1-10
  isPersonalRecord: boolean;
  completedAt: string;
}
```

---

## Data Merge Strategy

| Metric | Primary Source | Fallback | Reason |
|--------|---------------|----------|--------|
| Sleep stages | Garmin API | Apple HealthKit | Garmin has best staging |
| Steps | Apple HealthKit | Garmin | HealthKit deduplicates multiple sources |
| Resting HR / HRV | Garmin API | Apple HealthKit | Garmin wrist sensor is consistent |
| Body Battery / Stress | Garmin API | (none) | Garmin-exclusive |
| Training Load | Garmin API | (none) | Garmin-exclusive |
| Workouts (cardio) | Garmin API | Apple HealthKit | Richer GPS/HR data |
| Workouts (strength) | This app | Garmin | Our app has set/rep detail |

Deduplication: Match by date + time window (5-min tolerance for workouts). Keep all records but display highest-priority source.

---

## Garmin Integration (HR during strength training)

When the user logs a strength workout in this app, the Garmin watch is simultaneously recording HR. After the workout:
1. App saves the workout with timestamp range
2. On next Garmin sync, fetch HR data for that time range from Garmin API
3. Attach avg/max HR and HR zone breakdown to the workout session
4. Display HR graph alongside set history in workout detail view

---

## Google Drive Sync

- Export database as compressed JSON (per-table exports)
- Store in a dedicated app folder in Google Drive (`appDataFolder` scope)
- Sync on app open + manual trigger in settings
- Conflict resolution: last-write-wins with timestamp comparison
- Restore: download JSON, merge into local SQLite (skip duplicates by ID)

---

## Phased Implementation

### Phase 1: Foundation + Dashboard (Weeks 1-3)
- Expo project setup, dark theme, tab navigation
- Apple HealthKit integration (permissions, read steps/HR/sleep)
- SQLite schema + data access layer
- Dashboard screen with metric cards (steps, sleep, HR, active minutes)
- Basic Sleep & Activity detail screens

### Phase 2: Garmin Direct API (Weeks 4-5)
- Deploy Cloudflare Worker for OAuth 1.0a token exchange
- Garmin OAuth flow in app
- Fetch Body Battery, stress, detailed sleep, HRV from Garmin API
- Data normalizer + deduplication logic
- Heart & Stress detail screen with Body Battery chart

### Phase 3: Workout Planner (Weeks 6-8)
- Exercise library (200+ exercises as JSON seed data)
- Workout template CRUD (create, edit, reorder, supersets)
- Active workout screen (set logging, rest timer, previous performance display)
- PR detection and tracking
- Workout history with volume/frequency charts
- Garmin HR overlay on completed workouts

### Phase 4: Sync & Polish (Weeks 9-10)
- Google Sign-In + Drive API backup/restore
- Computed Recovery Score (from HRV + RHR + sleep)
- Trend charts (7-day, 30-day) on all detail screens
- Onboarding wizard
- Polish animations, haptic feedback

### Phase 5: Future (post-MVP)
- Fitbit Air integration via Google Health Connect
- iOS widgets (lock screen + home screen)
- Workout sharing / program import
- Auto-progression suggestions
- EAS Build + TestFlight distribution

---

## Verification / Testing

1. **HealthKit:** Run on physical iPhone via Expo Dev Client, verify permission prompts and data reads
2. **Garmin OAuth:** Test full flow: Worker deploy -> auth in app -> token stored -> API call returns data
3. **Dashboard:** Confirm cards render with real data, charts display correctly
4. **Workout:** Create template -> start workout -> log sets -> complete -> verify history shows correctly + PR detected
5. **Sync:** Sign into Google -> trigger sync -> verify file appears in Drive -> delete local DB -> restore from Drive -> verify data intact
6. **Deduplication:** Sync same day from Garmin + HealthKit -> confirm no duplicate entries displayed

---

## Key Files to Create First

1. `app.json` / `package.json` - Expo config + dependencies
2. `src/theme/colors.ts` - Dark theme palette
3. `src/db/schema.ts` - SQLite table definitions (health + workout)
4. `app/(tabs)/dashboard.tsx` - Main screen
5. `src/components/cards/MetricCard.tsx` - Reusable card widget
6. `src/services/appleHealth/healthKit.ts` - HealthKit read service
7. `src/data/exercises.json` - Pre-built exercise library
