import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { auth } from '@/utils/firebaseConfig';
import { SymbolView } from 'expo-symbols';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      // On success, _layout will automatically detect the user and render AppTabs
    } catch (error: any) {
      Alert.alert('Authentication Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <SymbolView name="lock.shield.fill" size={64} tintColor="#3B82F6" />
              <ThemedText type="title" style={styles.title}>
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                Secure access to your device dashboard
              </ThemedText>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <ThemedText type="smallBold" style={styles.label}>Email Address</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputContainer}>
                <ThemedText type="smallBold" style={styles.label}>Password</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <TouchableOpacity 
                style={styles.button} 
                onPress={handleAuth}
                disabled={loading}
              >
                <ThemedText style={styles.buttonText}>
                  {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity style={styles.toggleButton} onPress={() => setIsLogin(!isLogin)}>
                <ThemedText style={styles.toggleText}>
                  {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  content: {
    flex: 1,
    padding: Spacing.six,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.eight,
  },
  title: {
    fontSize: 28,
    marginTop: Spacing.four,
    marginBottom: Spacing.one,
  },
  subtitle: {
    opacity: 0.7,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: Spacing.four,
  },
  label: {
    marginBottom: Spacing.two,
    opacity: 0.8,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: Spacing.three,
    padding: Spacing.four,
    fontSize: 16,
    color: '#111827', // dark gray for contrast
  },
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: Spacing.three,
    padding: Spacing.four,
    alignItems: 'center',
    marginTop: Spacing.four,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleButton: {
    marginTop: Spacing.five,
    alignItems: 'center',
  },
  toggleText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
});
