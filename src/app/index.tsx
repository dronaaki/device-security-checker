import { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { runAllSecurityChecks, getDeviceSecurityInfo, SecurityCheckResult, DeviceSecurityInfo } from '@/utils/securityChecks';
import { registerBackgroundTask } from '@/utils/backgroundTasks';
import { requestNotificationPermissions } from '@/utils/notifications';
import { saveSecurityLog, getRecentLogs, SecurityLog } from '@/utils/securityLogs';
import { getRecommendations } from '@/utils/recommendations';

export default function SecurityDashboard() {
  const [securityChecks, setSecurityChecks] = useState<SecurityCheckResult[]>([]);
  const [deviceInfo, setDeviceInfo] = useState<DeviceSecurityInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentLogs, setRecentLogs] = useState<SecurityLog[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();

  const loadSecurityData = async () => {
    try {
      const [checks, info] = await Promise.all([
        runAllSecurityChecks(),
        getDeviceSecurityInfo(),
      ]);
      setSecurityChecks(checks);
      setDeviceInfo(info);

      const overallStatus = getOverallStatus(checks);
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
      loadRecentLogs();
    } catch (error) {
      console.error('Error loading security data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSecurityData();
    setRefreshing(false);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadSecurityData();
      await initializeBackgroundServices();
      setLoading(false);
    };
    init();
  }, []);

  const loadRecentLogs = async () => {
    const logs = await getRecentLogs(3);
    setRecentLogs(logs);
  };

  const initializeBackgroundServices = async () => {
    try {
      await requestNotificationPermissions();
      await registerBackgroundTask();
    } catch (error) {
      console.error('Error initializing background services:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'secure': return '#10B981'; // vibrant green
      case 'warning': return '#F59E0B'; // amber
      case 'critical': return '#EF4444'; // vibrant red
      case 'info': return '#3B82F6'; // blue
      default: return '#6B7280'; // gray
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'secure': return 'checkmark.shield.fill';
      case 'warning': return 'exclamationmark.triangle.fill';
      case 'critical': return 'xmark.shield.fill';
      case 'info': return 'info.circle.fill';
      default: return 'shield';
    }
  };

  const getOverallStatus = (checks = securityChecks) => {
    if (checks.length === 0) return 'unknown';
    if (checks.some(check => check.status === 'critical')) return 'critical';
    if (checks.some(check => check.status === 'warning')) return 'warning';
    return 'secure';
  };

  const overallStatus = getOverallStatus();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <ThemedView style={styles.header}>
            <ThemedText type="title" style={styles.headerTitle}>Dashboard</ThemedText>
            <ThemedText type="small" style={styles.headerSubtitle}>Real-time device protection</ThemedText>
          </ThemedView>

          {loading && !refreshing ? (
            <ThemedView style={styles.loadingContainer}>
              <ThemedText>Analyzing device security...</ThemedText>
            </ThemedView>
          ) : (
            <>
              {/* Overall Status Hero Card */}
              <ThemedView type="backgroundElement" style={[styles.heroCard, { borderColor: getStatusColor(overallStatus), borderWidth: 2 }]}>
                <View style={styles.heroContent}>
                  <SymbolView 
                    name={getStatusIcon(overallStatus) as any} 
                    size={48} 
                    tintColor={getStatusColor(overallStatus)} 
                  />
                  <View style={styles.heroTextContainer}>
                    <ThemedText type="subtitle">System Status</ThemedText>
                    <ThemedText style={[styles.heroStatus, { color: getStatusColor(overallStatus) }]}>
                      {overallStatus.toUpperCase()}
                    </ThemedText>
                  </View>
                </View>
              </ThemedView>

              {/* Device Info Grid */}
              {deviceInfo && (
                <ThemedView style={styles.gridContainer}>
                  <ThemedView type="backgroundElement" style={styles.gridItem}>
                    <SymbolView name="iphone" size={24} tintColor={theme.text} />
                    <ThemedText type="smallBold" style={{ marginTop: 8 }}>{deviceInfo.deviceName}</ThemedText>
                    <ThemedText type="small">{deviceInfo.osVersion}</ThemedText>
                  </ThemedView>
                  <ThemedView type="backgroundElement" style={styles.gridItem}>
                    <SymbolView name="network" size={24} tintColor={theme.text} />
                    <ThemedText type="smallBold" style={{ marginTop: 8 }}>{deviceInfo.networkType}</ThemedText>
                    <ThemedText type="small">{deviceInfo.ipAddress || 'No IP'}</ThemedText>
                  </ThemedView>
                </ThemedView>
              )}

              {/* Security Checks List */}
              <ThemedView style={styles.sectionHeader}>
                <ThemedText type="subtitle">Security Checks</ThemedText>
              </ThemedView>
              
              <View style={styles.checksList}>
                {securityChecks.map((check) => (
                  <ThemedView key={check.id} type="backgroundElement" style={styles.checkCard}>
                    <View style={styles.checkCardHeader}>
                      <View style={styles.checkCardTitleRow}>
                        <SymbolView 
                          name={getStatusIcon(check.status) as any} 
                          size={20} 
                          tintColor={getStatusColor(check.status)} 
                        />
                        <ThemedText type="default" style={styles.checkCardTitle}>{check.name}</ThemedText>
                      </View>
                    </View>
                    <ThemedText type="small" style={styles.checkMessage}>
                      {check.message}
                    </ThemedText>
                  </ThemedView>
                ))}
              </View>

              {/* Recommendations Toggle */}
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={() => setShowRecommendations(!showRecommendations)}
                activeOpacity={0.8}
              >
                <ThemedText style={styles.actionButtonText}>
                  {showRecommendations ? 'Hide' : 'Show'} Recommendations
                </ThemedText>
              </TouchableOpacity>

              {/* Recommendations */}
              {showRecommendations && (
                <View style={styles.recommendationsContainer}>
                  {getRecommendations(securityChecks).length === 0 ? (
                    <ThemedText type="small" style={{ textAlign: 'center' }}>No recommendations at this time. Great job!</ThemedText>
                  ) : (
                    getRecommendations(securityChecks).slice(0, 3).map((rec) => (
                      <ThemedView key={rec.id} type="backgroundElement" style={styles.recCard}>
                        <ThemedText type="smallBold">{rec.title}</ThemedText>
                        <ThemedText type="small" style={styles.recDesc}>{rec.description}</ThemedText>
                      </ThemedView>
                    ))
                  )}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.six,
    maxWidth: MaxContentWidth,
    marginHorizontal: 'auto',
    width: '100%',
  },
  header: {
    paddingVertical: Spacing.four,
    marginBottom: Spacing.two,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    opacity: 0.7,
    marginTop: 4,
  },
  loadingContainer: {
    padding: Spacing.six,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    padding: Spacing.five,
    borderRadius: Spacing.four,
    marginBottom: Spacing.four,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    elevation: 5,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroTextContainer: {
    marginLeft: Spacing.four,
  },
  heroStatus: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },
  gridContainer: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginBottom: Spacing.five,
  },
  gridItem: {
    flex: 1,
    padding: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  sectionHeader: {
    marginBottom: Spacing.three,
  },
  checksList: {
    gap: Spacing.three,
    marginBottom: Spacing.five,
  },
  checkCard: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
  },
  checkCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  checkCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  checkCardTitle: {
    fontWeight: '600',
  },
  checkMessage: {
    opacity: 0.8,
    marginTop: Spacing.one,
    paddingLeft: Spacing.six,
  },
  actionButton: {
    backgroundColor: '#3B82F6',
    padding: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  recommendationsContainer: {
    gap: Spacing.three,
  },
  recCard: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  recDesc: {
    marginTop: Spacing.one,
    opacity: 0.8,
  },
});
