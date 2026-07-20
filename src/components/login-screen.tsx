import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithEmailAndPassword, signInWithRedirect, GoogleAuthProvider } from 'firebase/auth';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { auth } from '@/utils/firebaseConfig';
import { SymbolView } from 'expo-symbols';

// Account creation is disabled project-side ("user actions" in Firebase Auth
// settings), so any attempt to register — including a first-time Google user —
// comes back as auth/admin-restricted-operation.
function describeAuthError(error: { code?: string; message?: string }): string {
  switch (error.code) {
    case 'auth/admin-restricted-operation':
      return 'This app is not accepting new accounts. Contact the owner to have one created for you.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'auth/invalid-email':
      return 'That email address is not valid.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    default:
      return error.message ?? 'Something went wrong. Please try again.';
  }
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAuth = async () => {
    if (!email || !password) {
      setErrorMessage('Please enter email and password.');
      return;
    }

    setErrorMessage('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Authentication Error:', error);
      setErrorMessage(describeAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMessage('');
    try {
      if (Platform.OS === 'web') {
        await signInWithRedirect(auth, new GoogleAuthProvider());
      } else {
        setErrorMessage('Google Sign-In on iOS/Android requires native Expo AuthSession setup, which is not yet configured. Please use Email/Password.');
      }
    } catch (error: any) {
      console.error('Google Auth Error:', error);
      setErrorMessage(describeAuthError(error));
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
                Welcome Back
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                Secure access to your device dashboard
              </ThemedText>
            </View>

            <View style={styles.form}>
              <TouchableOpacity 
                style={styles.googleButton} 
                onPress={handleGoogleAuth}
                disabled={loading}
              >
                <SymbolView name="g.circle.fill" size={24} tintColor="#fff" />
                <ThemedText style={styles.googleButtonText}>
                  Continue with Google
                </ThemedText>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.line} />
                <ThemedText style={styles.dividerText}>or</ThemedText>
                <View style={styles.line} />
              </View>

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
                  {loading ? 'Processing...' : 'Sign In'}
                </ThemedText>
              </TouchableOpacity>

              <ThemedText style={styles.noAccountText}>
                Don't have an account? Contact the owner to have one created for you.
              </ThemedText>

              {errorMessage ? (
                <View style={styles.errorContainer}>
                  <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
                </View>
              ) : null}
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
    marginBottom: Spacing.six,
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
    color: '#111827',
  },
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: Spacing.three,
    padding: Spacing.four,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  googleButton: {
    backgroundColor: '#DB4437',
    borderRadius: Spacing.three,
    padding: Spacing.four,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  googleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: Spacing.two,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: Spacing.three,
    opacity: 0.5,
  },
  noAccountText: {
    marginTop: Spacing.five,
    textAlign: 'center',
    opacity: 0.6,
    fontSize: 13,
  },
  errorContainer: {
    marginTop: Spacing.four,
    padding: Spacing.three,
    backgroundColor: '#FEE2E2',
    borderRadius: Spacing.two,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
});
