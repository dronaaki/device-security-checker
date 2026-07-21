import { useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, View, Platform } from 'react-native';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import * as Device from 'expo-device';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import LoginScreen from '@/components/login-screen';
import { auth, db } from '@/utils/firebaseConfig';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const isSuperadmin = currentUser.email === 'mosaicmusic02@gmail.com';
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists() && userDoc.data().isDeleted) {
            console.log("User is soft-deleted. Logging out.");
            await signOut(auth);
            setUser(null);
            setIsAdmin(false);
            setAuthChecked(true);
            return;
          }

          let isActiveAdmin = false;
          if (userDoc.exists()) {
             const data = userDoc.data();
             const hasValidExpiration = !data.accessExpiresAtMillis || Date.now() < data.accessExpiresAtMillis;
             isActiveAdmin = data.isAdmin === true && hasValidExpiration;
          }

          const finalIsAdmin = isSuperadmin || isActiveAdmin;

          const deviceInfo = {
            deviceName: Device.deviceName || 'Unknown Device',
            deviceModel: Device.modelName || 'Unknown Model',
            osVersion: `${Platform.OS} ${Device.osVersion || ''}`,
          };

          await setDoc(userDocRef, {
            email: currentUser.email,
            displayName: currentUser.displayName,
            createdAt: userDoc.exists() && userDoc.data().createdAt ? userDoc.data().createdAt : new Date().toISOString(),
            isAdmin: finalIsAdmin,
            lastLogin: new Date().toISOString(),
            deviceInfo
          }, { merge: true });

          setUser(currentUser);
          setIsAdmin(finalIsAdmin);
        } catch (error) {
          console.error("Error syncing user data:", error);
          // If we fail to fetch due to permissions, it might be because they are deleted
          // However, we shouldn't log out just on a network error.
          setUser(currentUser);
          setIsAdmin(currentUser.email === 'mosaicmusic02@gmail.com');
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setAuthChecked(true);
    });
    return unsubscribe;
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      {authChecked ? (
        user ? <AppTabs isAdmin={isAdmin} /> : <LoginScreen />
      ) : (
        <View style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }} />
      )}
    </ThemeProvider>
  );
}
