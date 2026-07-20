import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithRedirect, GoogleAuthProvider } from 'firebase/auth';

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
      setErrorMessage('Please enter email and password.');
      return;
    }

    setErrorMessage('');
    setLoading(true);
    try {
      console.log('Starting Email Auth process...');
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      console.log('Email Auth successful!');
    } catch (error: any) {
      console.error('Authentication Error:', error);
      setErrorMessage(`Auth Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const [errorMessage, setErrorMessage] = useState('');

  const handleGoogleAuth = async () => {
    console.log('Google Auth button clicked!');
    setErrorMessage('');
    try {
      if (Platform.OS === 'web') {
        console.log('Initializing GoogleAuthProvider...');
        const provider = new GoogleAuthProvider();
        console.log('Calling signInWithRedirect...');
        await signInWithRedirect(auth, provider);
        console.log('signInWithRedirect call completed.');
      } else {
        setErrorMessage('Google Sign-In on iOS/Android requires native Expo AuthSession setup, which is not yet configured. Please test on Web or use Email/Password.');
      }
    } catch (error: any) {
      console.error('Google Auth Error:', error);
      setErrorMessage(`Error: ${error.message} (${error.code})`);
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
                  {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity style={styles.toggleButton} onPress={() => setIsLogin(!isLogin)}>
                <ThemedText style={styles.toggleText}>
                  {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                </ThemedText>
              </TouchableOpacity>
              
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
  toggleButton: {
    marginTop: Spacing.five,
    alignItems: 'center',
  },
  toggleText: {
    color: '#3B82F6',
    fontWeight: '600',
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
