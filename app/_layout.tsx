import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { View, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { ShieldCheck, Lock } from 'lucide-react-native';

import Theme from '@/constants/Theme';
import { Typography, useThemeColors } from '@/components/AppComponents';
import { useFinanceStore } from '@/store/useFinanceStore';
import { requestNotificationPermissions, scheduleDailyReminder } from '@/services/notifications';

export default function RootLayout() {
  const { biometricsEnabled } = useFinanceStore();
  const [isAuthenticated, setIsAuthenticated] = useState(!biometricsEnabled);
  const colors = useThemeColors();
  const theme = useFinanceStore((state) => state.theme) || 'dark';

  const handleAuth = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      setIsAuthenticated(true);
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to access your Vault',
      fallbackLabel: 'Use Passcode',
    });

    if (result.success) {
      setIsAuthenticated(true);
    }
  };

  useEffect(() => {
    // Initialize Database
    useFinanceStore.getState().init();

    if (biometricsEnabled) {
      handleAuth();
    }
    
    // Initialize Notifications
    (async () => {
      const hasPermission = await requestNotificationPermissions();
      if (hasPermission) {
        await scheduleDailyReminder();
      }
    })();
  }, [biometricsEnabled]);

  if (!isAuthenticated) {
    return (
      <View style={[styles.authContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.lockIcon, { backgroundColor: colors.card }]}>
          <Lock size={48} color={colors.primary} />
        </View>
        <Typography variant="h2" style={{ marginBottom: 8 }}>Vault Locked</Typography>
        <Typography variant="body" align="center" style={{ marginBottom: 32 }}>
          Your financial data is protected by biometric security.
        </Typography>
        <TouchableOpacity 
          style={[styles.authBtn, { backgroundColor: colors.primary }]} 
          onPress={handleAuth}
        >
          <ShieldCheck size={20} color="white" />
          <Typography variant="bodyBold" color="white" style={{ marginLeft: 8 }}>Unlock with Biometrics</Typography>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  lockIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  authBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
});
