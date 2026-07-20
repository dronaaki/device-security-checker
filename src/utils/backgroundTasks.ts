import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { Platform } from 'react-native';
import { runAllSecurityChecks } from './securityChecks';
import { getSettings } from './settings';
import { sendCriticalSecurityAlert, sendWarningSecurityAlert } from './notifications';

const BACKGROUND_SECURITY_TASK = 'BACKGROUND_SECURITY_TASK';

export async function registerBackgroundTask() {
  if (Platform.OS === 'web') {
    console.log('Background tasks not supported on web');
    return;
  }

  try {
    // Define the background task
    TaskManager.defineTask(BACKGROUND_SECURITY_TASK, async () => {
      try {
        console.log('Running background security check...');
        const checks = await runAllSecurityChecks();
        
        // Get settings for notification preferences
        const settings = await getSettings();
        
        // Check for critical issues
        const criticalIssues = checks.filter(check => check.status === 'critical');
        const warningIssues = checks.filter(check => check.status === 'warning');
        
        if (settings.notificationsEnabled && settings.criticalAlertsEnabled && criticalIssues.length > 0) {
          console.warn('Critical security issues detected:', criticalIssues);
          for (const issue of criticalIssues) {
            await sendCriticalSecurityAlert(issue.name);
          }
        }
        
        if (settings.notificationsEnabled && settings.warningAlertsEnabled && warningIssues.length > 0) {
          console.warn('Warning security issues detected:', warningIssues);
          for (const issue of warningIssues) {
            await sendWarningSecurityAlert(issue.name);
          }
        }
        
        return BackgroundFetch.BackgroundFetchResult.NewData;
      } catch (error) {
        console.error('Background security check failed:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });

    // Register the task with settings-based interval
    const settings = await getSettings();
    const status = await BackgroundFetch.getStatusAsync();
    if (status === BackgroundFetch.BackgroundFetchStatus.Available) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_SECURITY_TASK, {
        minimumInterval: settings.checkFrequency * 60, // expects seconds
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('Background security task registered successfully');
    } else {
      console.warn('Background fetch not available:', status);
    }
  } catch (error) {
    console.error('Error registering background task:', error);
  }
}

export async function unregisterBackgroundTask() {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SECURITY_TASK);
    console.log('Background security task unregistered');
  } catch (error) {
    console.error('Error unregistering background task:', error);
  }
}

export const BACKGROUND_TASK_NAME = BACKGROUND_SECURITY_TASK;
