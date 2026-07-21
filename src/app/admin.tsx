import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TextInput, Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { db } from '@/utils/firebaseConfig';
import { AI_PROVIDERS, AIProviderId } from '@/utils/ai';

export default function AdminScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // AI Provider state
  const [providerId, setProviderId] = useState<AIProviderId | ''>('');
  const [model, setModel] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch users
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersData = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);

      // Fetch AI Config
      const configDoc = await getDoc(doc(db, 'config', 'ai_provider'));
      if (configDoc.exists()) {
        const data = configDoc.data();
        setProviderId(data.providerId || '');
        setModel(data.model || '');
        setBaseUrl(data.baseUrl || '');
        setApiKey(data.apiKey || '');
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveAiConfig = async () => {
    try {
      setSavingConfig(true);
      await setDoc(doc(db, 'config', 'ai_provider'), {
        providerId,
        model,
        baseUrl,
        apiKey
      });
      alert('AI Configuration saved successfully!');
    } catch (error) {
      console.error("Error saving AI config:", error);
      alert('Failed to save config.');
    } finally {
      setSavingConfig(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText style={{ textAlign: 'center', marginTop: 20 }}>Loading admin data...</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <ThemedView style={styles.header}>
            <ThemedText type="title">Admin Dashboard</ThemedText>
            <ThemedText type="small">Manage resources and subscribers</ThemedText>
          </ThemedView>

          {/* AI Resource Management */}
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="subtitle">AI Provider Config</ThemedText>
            
            <View style={styles.inputGroup}>
              <ThemedText type="small">Provider ID</ThemedText>
              <TextInput
                style={styles.input}
                value={providerId}
                onChangeText={(t) => setProviderId(t as AIProviderId)}
                placeholder="ollama, anthropic, openrouter..."
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="small">Model</ThemedText>
              <TextInput
                style={styles.input}
                value={model}
                onChangeText={setModel}
                placeholder="e.g. claude-opus-4-8"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="small">Base URL</ThemedText>
              <TextInput
                style={styles.input}
                value={baseUrl}
                onChangeText={setBaseUrl}
                placeholder="Optional proxy URL"
                placeholderTextColor="#999"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="small">API Key</ThemedText>
              <TextInput
                style={styles.input}
                value={apiKey}
                onChangeText={setApiKey}
                placeholder="Secret API Key"
                placeholderTextColor="#999"
                secureTextEntry
              />
            </View>

            <Button title={savingConfig ? "Saving..." : "Save Config"} onPress={saveAiConfig} disabled={savingConfig} />
          </ThemedView>

          {/* Subscribers List */}
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="subtitle">Subscribers ({users.length})</ThemedText>
            {users.map(user => (
              <View key={user.id} style={styles.userRow}>
                <ThemedText type="default">{user.displayName || user.email}</ThemedText>
                <ThemedText type="small">{user.email}</ThemedText>
                {user.isAdmin && <ThemedText style={styles.adminBadge}>ADMIN</ThemedText>}
              </View>
            ))}
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
  inputGroup: {
    marginBottom: Spacing.three,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: Spacing.two,
    borderRadius: Spacing.one,
    marginTop: Spacing.one,
    color: '#000',
  },
  userRow: {
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  adminBadge: {
    color: '#F44336',
    fontWeight: 'bold',
    fontSize: 12,
    marginTop: 4,
  }
});
