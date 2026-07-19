import * as SecureStore from 'expo-secure-store';

const SETTINGS_KEY = 'app_settings';

export interface AppSettings {
  checkFrequency: number; // in minutes
  notificationsEnabled: boolean;
  criticalAlertsEnabled: boolean;
  warningAlertsEnabled: boolean;
  backgroundChecksEnabled: boolean;
  autoRunOnAppStart: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  checkFrequency: 15,
  notificationsEnabled: true,
  criticalAlertsEnabled: true,
  warningAlertsEnabled: true,
  backgroundChecksEnabled: true,
  autoRunOnAppStart: true,
};

export async function getSettings(): Promise<AppSettings> {
  try {
    const settingsJson = await SecureStore.getItemAsync(SETTINGS_KEY);
    if (!settingsJson) return DEFAULT_SETTINGS;
    
    const settings = JSON.parse(settingsJson);
    return { ...DEFAULT_SETTINGS, ...settings };
  } catch (error) {
    console.error('Error getting settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    const settingsJson = JSON.stringify(settings);
    await SecureStore.setItemAsync(SETTINGS_KEY, settingsJson);
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

export async function updateSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): Promise<void> {
  const settings = await getSettings();
  settings[key] = value;
  await saveSettings(settings);
}

export async function resetSettings(): Promise<void> {
  await saveSettings(DEFAULT_SETTINGS);
}
