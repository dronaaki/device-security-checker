import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { AppSettings, getSettings, saveSettings } from '@/utils/settings';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const loadedSettings = await getSettings();
    setSettings(loadedSettings);
  };

  const updateSetting = async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    if (!settings) return;
    
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  if (!settings) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText>Loading settings...</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <ThemedView style={styles.header}>
            <ThemedText type="title">Settings</ThemedText>
            <ThemedText type="small">Configure your security preferences</ThemedText>
          </ThemedView>

          {/* Check Frequency */}
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="subtitle">Check Frequency</ThemedText>
            <ThemedView style={styles.settingRow}>
              <ThemedText type="small">Background checks every {settings.checkFrequency} minutes</ThemedText>
            </ThemedView>
            <ThemedView style={styles.frequencyButtons}>
              {[5, 15, 30, 60].map((minutes) => (
                <ThemedView
                  key={minutes}
                  style={[
                    styles.frequencyButton,
                    settings.checkFrequency === minutes && styles.frequencyButtonActive,
                  ]}
                >
                  <ThemedText
                    type="small"
                    onPress={() => updateSetting('checkFrequency', minutes)}
                    style={[
                      styles.frequencyButtonText,
                      settings.checkFrequency === minutes && styles.frequencyButtonTextActive,
                    ]}
                  >
                    {minutes}m
                  </ThemedText>
                </ThemedView>
              ))}
            </ThemedView>
          </ThemedView>

          {/* Notifications */}
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="subtitle">Notifications</ThemedText>
            
            <ThemedView style={styles.settingRow}>
              <ThemedText type="default">Enable Notifications</ThemedText>
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={(value) => updateSetting('notificationsEnabled', value)}
              />
            </ThemedView>

            <ThemedView style={styles.settingRow}>
              <ThemedText type="small">Critical Alerts</ThemedText>
              <Switch
                value={settings.criticalAlertsEnabled}
                onValueChange={(value) => updateSetting('criticalAlertsEnabled', value)}
                disabled={!settings.notificationsEnabled}
              />
            </ThemedView>

            <ThemedView style={styles.settingRow}>
              <ThemedText type="small">Warning Alerts</ThemedText>
              <Switch
                value={settings.warningAlertsEnabled}
                onValueChange={(value) => updateSetting('warningAlertsEnabled', value)}
                disabled={!settings.notificationsEnabled}
              />
            </ThemedView>
          </ThemedView>

          {/* Background Checks */}
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="subtitle">Background Checks</ThemedText>
            
            <ThemedView style={styles.settingRow}>
              <ThemedText type="default">Enable Background Checks</ThemedText>
              <Switch
                value={settings.backgroundChecksEnabled}
                onValueChange={(value) => updateSetting('backgroundChecksEnabled', value)}
              />
            </ThemedView>

            <ThemedView style={styles.settingRow}>
              <ThemedText type="small">Auto-run on App Start</ThemedText>
              <Switch
                value={settings.autoRunOnAppStart}
                onValueChange={(value) => updateSetting('autoRunOnAppStart', value)}
              />
            </ThemedView>
          </ThemedView>

          {/* Reset Button */}
          <ThemedView type="backgroundElement" style={[styles.card, styles.resetCard]}>
            <ThemedText type="default" onPress={() => {
              saveSettings({
                checkFrequency: 15,
                notificationsEnabled: true,
                criticalAlertsEnabled: true,
                warningAlertsEnabled: true,
                backgroundChecksEnabled: true,
                autoRunOnAppStart: true,
              });
              loadSettings();
            }} style={styles.resetButton}>
              Reset to Defaults
            </ThemedText>
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    maxWidth: MaxContentWidth,
    marginHorizontal: 'auto',
    width: '100%',
  },
  header: {
    paddingVertical: Spacing.four,
    alignItems: 'center',
  },
  card: {
    marginBottom: Spacing.three,
    padding: Spacing.four,
    borderRadius: Spacing.three,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  frequencyButtons: {
    flexDirection: 'row',
    marginTop: Spacing.three,
    gap: Spacing.two,
  },
  frequencyButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  frequencyButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  frequencyButtonText: {
    color: '#007AFF',
  },
  frequencyButtonTextActive: {
    color: '#FFFFFF',
  },
  resetCard: {
    alignItems: 'center',
  },
  resetButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F44336',
  },
});
