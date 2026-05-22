import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../src/components/ui/Card';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useHealthData } from '../../src/hooks/useHealthData';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';

export default function SettingsScreen() {
  const { isHealthKitConnected, isGarminConnected, isGoogleDriveConnected } = useSettingsStore();
  const { connectHealthKit } = useHealthData();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>Settings</Text>
          <View style={styles.backButton} />
        </View>

        {/* Connections */}
        <Text style={styles.sectionTitle}>Data Sources</Text>

        <Card>
          <ConnectionRow
            icon="fitness-outline"
            title="Apple Health"
            connected={isHealthKitConnected}
            onPress={connectHealthKit}
          />
          <View style={styles.divider} />
          <ConnectionRow
            icon="watch-outline"
            title="Garmin Connect"
            connected={isGarminConnected}
            onPress={() => {/* TODO: Garmin OAuth */}}
          />
          <View style={styles.divider} />
          <ConnectionRow
            icon="cloud-outline"
            title="Google Drive Sync"
            connected={isGoogleDriveConnected}
            onPress={() => {/* TODO: Google Sign-In */}}
          />
        </Card>

        {/* Goals */}
        <Text style={styles.sectionTitle}>Goals</Text>

        <Card>
          <GoalRow label="Daily Steps" value="10,000" />
          <View style={styles.divider} />
          <GoalRow label="Sleep" value="8 hours" />
          <View style={styles.divider} />
          <GoalRow label="Active Minutes" value="30 min" />
        </Card>

        {/* Preferences */}
        <Text style={styles.sectionTitle}>Preferences</Text>

        <Card>
          <GoalRow label="Weight Unit" value="kg" />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function ConnectionRow({
  icon,
  title,
  connected,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  connected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.connectionRow} onPress={onPress}>
      <View style={styles.connectionLeft}>
        <Ionicons name={icon} size={22} color={colors.textSecondary} />
        <Text style={styles.connectionTitle}>{title}</Text>
      </View>
      <View style={styles.connectionRight}>
        <Text style={[styles.connectionStatus, { color: connected ? colors.success : colors.textTertiary }]}>
          {connected ? 'Connected' : 'Connect'}
        </Text>
        <Ionicons
          name={connected ? 'checkmark-circle' : 'chevron-forward'}
          size={18}
          color={connected ? colors.success : colors.textTertiary}
        />
      </View>
    </Pressable>
  );
}

function GoalRow({ label, value }: { label: string; value: string }) {
  return (
    <Pressable style={styles.connectionRow}>
      <Text style={styles.connectionTitle}>{label}</Text>
      <View style={styles.connectionRight}>
        <Text style={styles.goalValue}>{value}</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  connectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  connectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  connectionTitle: {
    ...typography.body,
    color: colors.textPrimary,
  },
  connectionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  connectionStatus: {
    ...typography.bodySmall,
  },
  goalValue: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
});
