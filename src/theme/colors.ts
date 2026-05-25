export const colors = {
  // Background
  background: '#0D0D0F',
  surface: '#1A1A1E',
  surfaceElevated: '#242428',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A8',
  textTertiary: '#6B6B73',

  // Accent colors for metric cards
  sleep: '#7C6BFF',
  activity: '#4ADE80',
  heart: '#FF5757',
  stress: '#FFB347',
  recovery: '#00D4AA',
  bodyBattery: '#FFD700',
  steps: '#38BDF8',
  calories: '#FB923C',

  // UI
  border: '#2A2A2E',
  cardBorder: '#2E2E34',
  success: '#4ADE80',
  warning: '#FFB347',
  error: '#FF5757',
  info: '#38BDF8',

  // Progress bars
  progressBackground: '#2A2A2E',
  progressFill: '#4ADE80',
} as const;

export type ColorKey = keyof typeof colors;
