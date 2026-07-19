import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getSecurityLogs, clearSecurityLogs, SecurityLog, getSecurityStats } from '@/utils/securityLogs';

export default function SecurityLogsScreen() {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [fetchedLogs, fetchedStats] = await Promise.all([
        getSecurityLogs(),
        getSecurityStats(),
      ]);
      setLogs(fetchedLogs);
      setStats(fetchedStats);
    } catch (error) {
      console.error('Error loading logs data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleClearLogs = () => {
    Alert.alert(
      'Clear Logs',
      'Are you sure you want to delete all security logs? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearSecurityLogs();
            await loadData();
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'secure': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'critical': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <ThemedView style={styles.header}>
            <ThemedText type="title">Security Logs</ThemedText>
            <ThemedText type="small">History of automated device checks</ThemedText>
          </ThemedView>

          {stats && logs.length > 0 && (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="subtitle">Summary Statistics</ThemedText>
              <ThemedView style={styles.statsRow}>
                <ThemedView style={styles.statBox}>
                  <ThemedText type="title">{stats.totalChecks}</ThemedText>
                  <ThemedText type="small">Total Checks</ThemedText>
                </ThemedView>
                <ThemedView style={styles.statBox}>
                  <ThemedText type="title" style={{ color: getStatusColor('secure') }}>{stats.secureCount}</ThemedText>
                  <ThemedText type="small">Secure</ThemedText>
                </ThemedView>
              </ThemedView>
              <ThemedView style={[styles.statsRow, { marginTop: Spacing.two }]}>
                <ThemedView style={styles.statBox}>
                  <ThemedText type="title" style={{ color: getStatusColor('warning') }}>{stats.warningCount}</ThemedText>
                  <ThemedText type="small">Warnings</ThemedText>
                </ThemedView>
                <ThemedView style={styles.statBox}>
                  <ThemedText type="title" style={{ color: getStatusColor('critical') }}>{stats.criticalCount}</ThemedText>
                  <ThemedText type="small">Critical</ThemedText>
                </ThemedView>
              </ThemedView>
            </ThemedView>
          )}

          {logs.length === 0 ? (
            <ThemedView style={styles.emptyContainer}>
              <ThemedText>No security logs found.</ThemedText>
              <ThemedText type="small" style={{ textAlign: 'center', marginTop: Spacing.two }}>
                Logs will appear here when background checks run or when you refresh the dashboard.
              </ThemedText>
            </ThemedView>
          ) : (
            <ThemedView style={styles.logsContainer}>
              <ThemedView style={styles.logsHeaderRow}>
                <ThemedText type="subtitle">History</ThemedText>
                <ThemedText type="linkPrimary" onPress={handleClearLogs}>Clear All</ThemedText>
              </ThemedView>

              {logs.map((log) => (
                <ThemedView key={log.id} type="backgroundElement" style={styles.logCard}>
                  <ThemedView style={styles.logHeader}>
                    <ThemedText type="default" style={{ fontWeight: '600' }}>
                      {log.timestamp.toLocaleDateString()} {log.timestamp.toLocaleTimeString()}
                    </ThemedText>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(log.overallStatus) }]} />
                  </ThemedView>
                  <ThemedText type="small" style={{ opacity: 0.8, marginTop: Spacing.one }}>
                    Status: {log.overallStatus.toUpperCase()}
                  </ThemedText>
                  {log.checks.filter(c => c.status !== 'secure').length > 0 && (
                    <ThemedView style={styles.issuesContainer}>
                      <ThemedText type="smallBold" style={{ marginBottom: Spacing.one }}>Issues found:</ThemedText>
                      {log.checks.filter(c => c.status !== 'secure').map(issue => (
                        <ThemedText key={issue.id} type="small" style={{ opacity: 0.8 }}>
                          • {issue.name}: {issue.message}
                        </ThemedText>
                      ))}
                    </ThemedView>
                  )}
                </ThemedView>
              ))}
            </ThemedView>
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.three,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    borderRadius: Spacing.two,
  },
  emptyContainer: {
    padding: Spacing.six,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logsContainer: {
    marginTop: Spacing.two,
  },
  logsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  logCard: {
    marginBottom: Spacing.three,
    padding: Spacing.four,
    borderRadius: Spacing.three,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  issuesContainer: {
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
});
