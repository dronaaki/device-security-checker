import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermissions() {
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web');
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permissions not granted');
      return false;
    }

    console.log('Notification permissions granted');
    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

export async function sendSecurityAlert(title: string, body: string) {
  if (Platform.OS === 'web') {
    console.log('Security alert (web):', title, '-', body);
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'security_alert' },
      },
      trigger: null, // Show immediately
    });
    console.log('Security notification sent:', title);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

export async function sendCriticalSecurityAlert(issue: string) {
  await sendSecurityAlert(
    'Critical Security Alert',
    `Security issue detected: ${issue}. Please review your device security immediately.`
  );
}

export async function sendWarningSecurityAlert(issue: string) {
  await sendSecurityAlert(
    'Security Warning',
    `Security warning: ${issue}. Consider reviewing your device settings.`
  );
}

export async function scheduleRegularSecurityCheck(intervalMinutes: number = 60) {
  if (Platform.OS === 'web') {
    console.log('Scheduled notifications not supported on web');
    return;
  }

  try {
    // Cancel existing scheduled notifications with the same identifier
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Schedule a new recurring notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Security Check Reminder',
        body: 'Time to run a security check on your device.',
        data: { type: 'security_reminder' },
      },
      trigger: {
        seconds: intervalMinutes * 60,
        repeats: true,
      },
    });

    console.log(`Scheduled security check reminder every ${intervalMinutes} minutes`);
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
}
