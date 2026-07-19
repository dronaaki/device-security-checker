import { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { runAllSecurityChecks, getDeviceSecurityInfo, SecurityCheckResult, DeviceSecurityInfo } from '@/utils/securityChecks';
import { registerBackgroundTask } from '@/utils/backgroundTasks';
import { requestNotificationPermissions } from '@/utils/notifications';
import { saveSecurityLog, getRecentLogs, SecurityLog } from '@/utils/securityLogs';
import { getRecommendations } from '@/utils/recommendations';
import { generateVulnerabilityReport } from '@/utils/vulnerabilityReport';
import { getSettings } from '@/utils/settings';

export default function SecurityDashboard() {
  const [securityChecks, setSecurityChecks] = useState<SecurityCheckResult[]>([]);
  const [deviceInfo, setDeviceInfo] = useState<DeviceSecurityInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentLogs, setRecentLogs] = useState<SecurityLog[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);

  const loadSecurityData = async () => {
    setLoading(true);
    try {
      const [checks, info] = await Promise.all([
        runAllSecurityChecks(),
        getDeviceSecurityInfo(),
      ]);
      setSecurityChecks(checks);
      setDeviceInfo(info);

      // Save security log
      const overallStatus = getOverallStatus();
      const logStatus: 'secure' | 'warning' | 'critical' = 
        overallStatus === 'unknown' ? 'secure' : overallStatus;
      await saveSecurityLog({
        id: `log-${Date.now()}`,
        timestamp: new Date(),
        overallStatus: logStatus,
        checks,
        deviceInfo: {
          deviceName: info.deviceName,
          deviceModel: info.deviceModel,
          osVersion: info.osVersion,
        },
      });
    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSecurityData();
    initializeBackgroundServices();
    loadRecentLogs();
  }, []);

  const loadRecentLogs = async () => {
    const logs = await getRecentLogs(5);
    setRecentLogs(logs);
  };

  const initializeBackgroundServices = async () => {
    try {
      // Request notification permissions
      await requestNotificationPermissions();
      
      // Register background task for periodic security checks
      await registerBackgroundTask();
    } catch (error) {
      console.error('Error initializing background services:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'secure':
        return '#4CAF50';
      case 'warning':
        return '#FF9800';
      case 'critical':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getOverallStatus = () => {
    if (securityChecks.length === 0) return 'unknown';
    if (securityChecks.some(check => check.status === 'critical')) return 'critical';
    if (securityChecks.some(check => check.status === 'warning')) return 'warning';
    return 'secure';
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <ThemedView style={styles.header}>
            <ThemedText type="title">Device Security</ThemedText>
            <ThemedText type="small">Regular security monitoring</ThemedText>
          </ThemedView>

          {loading ? (
            <ThemedView style={styles.loadingContainer}>
              <ThemedText>Loading security data...</ThemedText>
            </ThemedView>
          ) : (
            <>
              {/* Overall Status */}
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText type="subtitle">Overall Status</ThemedText>
                <ThemedView style={styles.statusRow}>
                  <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(getOverallStatus()) }]} />
                  <ThemedText style={[styles.statusText, { color: getStatusColor(getOverallStatus()) }]}>
                    {getOverallStatus().toUpperCase()}
                  </ThemedText>
                </ThemedView>
              </ThemedView>

              {/* Device Info */}
              {deviceInfo && (
                <ThemedView type="backgroundElement" style={styles.card}>
                  <ThemedText type="subtitle">Device Information</ThemedText>
                  <ThemedView style={styles.infoRow}>
                    <ThemedText type="small">Device:</ThemedText>
                    <ThemedText type="small">{deviceInfo.deviceName}</ThemedText>
                  </ThemedView>
                  <ThemedView style={styles.infoRow}>
                    <ThemedText type="small">Model:</ThemedText>
                    <ThemedText type="small">{deviceInfo.deviceModel}</ThemedText>
                  </ThemedView>
                  <ThemedView style={styles.infoRow}>
                    <ThemedText type="small">OS Version:</ThemedText>
                    <ThemedText type="small">{deviceInfo.osVersion}</ThemedText>
                  </ThemedView>
                  <ThemedView style={styles.infoRow}>
                    <ThemedText type="small">Network:</ThemedText>
                    <ThemedText type="small">{deviceInfo.networkType}</ThemedText>
                  </ThemedView>
                  <ThemedView style={styles.infoRow}>
                    <ThemedText type="small">IP Address:</ThemedText>
                    <ThemedText type="small">{deviceInfo.ipAddress}</ThemedText>
                  </ThemedView>
                  <ThemedView style={styles.infoRow}>
                    <ThemedText type="small">Last Check:</ThemedText>
                    <ThemedText type="small">{deviceInfo.lastCheck.toLocaleTimeString()}</ThemedText>
                  </ThemedView>
                </ThemedView>
              )}

              {/* Security Checks */}
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText type="subtitle">Security Checks</ThemedText>
                {securityChecks.map((check) => (
                  <ThemedView key={check.id} style={styles.checkItem}>
                    <ThemedView style={styles.checkHeader}>
                      <ThemedText type="default">{check.name}</ThemedText>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(check.status) }]} />
                    </ThemedView>
                    <ThemedText type="small" style={styles.checkMessage}>
                      {check.message}
                    </ThemedText>
                    <ThemedText type="small" style={styles.checkTime}>
                      {check.timestamp.toLocaleTimeString()}
                    </ThemedText>
                  </ThemedView>
                ))}
              </ThemedView>

              {/* Refresh Button */}
              <ThemedView type="backgroundElement" style={[styles.card, styles.refreshCard]}>
                <ThemedText type="default" onPress={loadSecurityData} style={styles.refreshButton}>
                  Refresh Security Checks
                </ThemedText>
              </ThemedView>

              {/* Recent Logs */}
              {recentLogs.length > 0 && (
                <ThemedView type="backgroundElement" style={styles.card}>
                  <ThemedText type="subtitle">Recent Security Checks</ThemedText>
                  {recentLogs.map((log) => (
                    <ThemedView key={log.id} style={styles.logItem}>
                      <ThemedView style={styles.logHeader}>
                        <ThemedText type="small">{log.timestamp.toLocaleString()}</ThemedText>
                        <View style={[styles.statusDot, { backgroundColor: getStatusColor(log.overallStatus) }]} />
                      </ThemedView>
                      <ThemedText type="small" style={styles.logStatus}>
                        Status: {log.overallStatus.toUpperCase()}
                      </ThemedText>
                    </ThemedView>
                  ))}
                </ThemedView>
              )}

              {/* Recommendations Toggle */}
              <ThemedView type="backgroundElement" style={[styles.card, styles.refreshCard]}>
                <ThemedText type="default" onPress={() => setShowRecommendations(!showRecommendations)} style={styles.refreshButton}>
                  {showRecommendations ? 'Hide' : 'Show'} Security Recommendations
                </ThemedText>
              </ThemedView>

              {/* Recommendations */}
              {showRecommendations && (
                <ThemedView type="backgroundElement" style={styles.card}>
                  <ThemedText type="subtitle">Security Recommendations</ThemedText>
                  {getRecommendations(securityChecks).slice(0, 5).map((rec) => (
                    <ThemedView key={rec.id} style={styles.recItem}>
                      <ThemedText type="default" style={styles.recTitle}>
                        {rec.title}
                      </ThemedText>
                      <ThemedText type="small" style={styles.recDescription}>
                        {rec.description}
                      </ThemedText>
                      <ThemedText type="small" style={styles.recPriority}>
                        Priority: {rec.priority.toUpperCase()}
                      </ThemedText>
                    </ThemedView>
                  ))}
                </ThemedView>
              )}
            </>
          )}
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
  loadingContainer: {
    padding: Spacing.four,
    alignItems: 'center',
  },
  card: {
    marginBottom: Spacing.three,
    padding: Spacing.four,
    borderRadius: Spacing.three,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.two,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  checkItem: {
    marginTop: Spacing.three,
    paddingTop: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  checkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  checkMessage: {
    marginTop: Spacing.one,
    opacity: 0.8,
  },
  checkTime: {
    marginTop: Spacing.one,
    opacity: 0.5,
    fontSize: 12,
  },
  refreshCard: {
    alignItems: 'center',
  },
  refreshButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  logItem: {
    marginTop: Spacing.three,
    paddingTop: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logStatus: {
    marginTop: Spacing.one,
    opacity: 0.8,
  },
  recItem: {
    marginTop: Spacing.three,
    paddingTop: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  recTitle: {
    fontWeight: '600',
  },
  recDescription: {
    marginTop: Spacing.one,
    opacity: 0.8,
  },
  recPriority: {
    marginTop: Spacing.one,
    opacity: 0.6,
    fontSize: 12,
  },
});
