import * as storage from './storage';
import { SecurityCheckResult } from './securityChecks';

const LOGS_KEY = 'security_logs';
const MAX_LOGS = 100; // Keep only the last 100 logs

export interface SecurityLog {
  id: string;
  timestamp: Date;
  overallStatus: 'secure' | 'warning' | 'critical';
  checks: SecurityCheckResult[];
  deviceInfo: {
    deviceName: string;
    deviceModel: string;
    osVersion: string;
  };
}

import { auth, db } from './firebaseConfig';
import { doc, collection, setDoc } from 'firebase/firestore';

export async function saveSecurityLog(log: SecurityLog): Promise<void> {
  try {
    const existingLogs = await getSecurityLogs();
    const newLogs = [log, ...existingLogs].slice(0, MAX_LOGS);
    
    const logsJson = JSON.stringify(newLogs.map(l => ({
      ...l,
      timestamp: l.timestamp.toISOString(),
      checks: l.checks.map(c => ({
        ...c,
        timestamp: c.timestamp.toISOString(),
      })),
    })));
    
    await storage.setItem(LOGS_KEY, logsJson);

    // Sync to Firestore if authenticated
    if (auth.currentUser) {
      const logRef = doc(collection(db, 'users', auth.currentUser.uid, 'securityLogs'), log.id);
      await setDoc(logRef, {
        id: log.id,
        timestamp: log.timestamp.toISOString(),
        overallStatus: log.overallStatus,
        deviceInfo: log.deviceInfo,
        checks: log.checks.map(c => ({
          id: c.id,
          name: c.name,
          status: c.status,
          message: c.message,
          timestamp: c.timestamp.toISOString()
        }))
      });
    }

  } catch (error) {
    console.error('Error saving security log:', error);
  }
}

export async function getSecurityLogs(): Promise<SecurityLog[]> {
  try {
    const logsJson = await storage.getItem(LOGS_KEY);
    if (!logsJson) return [];
    
    const logs = JSON.parse(logsJson);
    return logs.map((log: any) => ({
      ...log,
      timestamp: new Date(log.timestamp),
      checks: log.checks.map((check: any) => ({
        ...check,
        timestamp: new Date(check.timestamp),
      })),
    }));
  } catch (error) {
    console.error('Error getting security logs:', error);
    return [];
  }
}

export async function clearSecurityLogs(): Promise<void> {
  try {
    await storage.deleteItem(LOGS_KEY);
  } catch (error) {
    console.error('Error clearing security logs:', error);
  }
}

export async function getRecentLogs(count: number = 10): Promise<SecurityLog[]> {
  const logs = await getSecurityLogs();
  return logs.slice(0, count);
}

export async function getSecurityStats() {
  const logs = await getSecurityLogs();
  
  if (logs.length === 0) {
    return {
      totalChecks: 0,
      secureCount: 0,
      warningCount: 0,
      criticalCount: 0,
      averageScore: 0,
    };
  }

  const secureCount = logs.filter(log => log.overallStatus === 'secure').length;
  const warningCount = logs.filter(log => log.overallStatus === 'warning').length;
  const criticalCount = logs.filter(log => log.overallStatus === 'critical').length;

  // Calculate average score (secure = 3, warning = 2, critical = 1)
  const totalScore = logs.reduce((sum, log) => {
    if (log.overallStatus === 'secure') return sum + 3;
    if (log.overallStatus === 'warning') return sum + 2;
    return sum + 1;
  }, 0);

  return {
    totalChecks: logs.length,
    secureCount,
    warningCount,
    criticalCount,
    averageScore: totalScore / logs.length,
  };
}
