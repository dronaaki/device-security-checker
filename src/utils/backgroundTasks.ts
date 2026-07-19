import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { Platform } from 'react-native';
import { runAllSecurityChecks } from './securityChecks';

const BACKGROUND_SECURITY_TASK = 'BACKGROUND_SECURITY_TASK';
const TASK_INTERVAL = 15 * 60 * 1000; // 15 minutes in milliseconds

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
        
        // Check for critical issues
        const criticalIssues = checks.filter(check => check.status === 'critical');
        
        if (criticalIssues.length > 0) {
          console.warn('Critical security issues detected:', criticalIssues);
          // Here you would trigger a notification
          // This would be handled by the notification system
        }
        
        return BackgroundFetch.BackgroundFetchResult.NewData;
      } catch (error) {
        console.error('Background security check failed:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });

    // Register the task
    const status = await BackgroundFetch.getStatusAsync();
    if (status === BackgroundFetch.Status.Available) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_SECURITY_TASK, {
        minimumInterval: TASK_INTERVAL,
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
