import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type * as SecureStoreTypes from 'expo-secure-store';

// expo-secure-store ships no web implementation — its native module methods are
// absent in the browser, so every call throws "…is not a function". Fall back to
// AsyncStorage (backed by localStorage) on web.
//
// Caveat: web storage is plaintext and readable by any script on the page. Only
// non-sensitive data (settings, check history) belongs here — never credentials.
const SecureStore: typeof SecureStoreTypes | null =
  Platform.OS === 'web' ? null : require('expo-secure-store');

export async function getItem(key: string): Promise<string | null> {
  if (!SecureStore) return AsyncStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

export async function setItem(key: string, value: string): Promise<void> {
  if (!SecureStore) {
    await AsyncStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function deleteItem(key: string): Promise<void> {
  if (!SecureStore) {
    await AsyncStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
