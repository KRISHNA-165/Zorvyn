import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { View, StyleSheet, TouchableOpacity, StatusBar, ActivityIndicator, Platform } from 'react-native';

import * as LocalAuthentication from 'expo-local-authentication';
import { ShieldCheck, Lock } from 'lucide-react-native';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';

import Theme from '@/constants/Theme';
import { Typography, useThemeColors, Button } from '@/components/AppComponents';
import { useFinanceStore } from '@/store/useFinanceStore';
import { requestNotificationPermissions, scheduleDailyReminder } from '@/services/notifications';

export default function RootLayout() {
  const { biometricsEnabled, isLoading, error, dbInitialized, init } = useFinanceStore();
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
    init();

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

  if (isLoading && !dbInitialized) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Typography style={{ marginTop: 16 }}>Initializing Secure Vault...</Typography>
      </View>
    );
  }

  if (error && !dbInitialized) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background, padding: 30 }]}>
        <View style={styles.errorIcon}>
           <Lock size={40} color={colors.expense} />
        </View>
        <Typography variant="h3" color={colors.expense}>Vault Initialization Failed</Typography>
        <Typography variant="body" align="center" style={{ marginTop: 12, opacity: 0.8 }}>
          We encountered a secure storage issue while preparing your financial records.
        </Typography>
        
        <View style={[styles.errorDetail, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Typography variant="small" color={colors.textSecondary} style={{ marginBottom: 4 }}>TECHNICAL DETAIL:</Typography>
          <Typography variant="small" style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
            {error || 'Unknown Native Exception'}
          </Typography>
        </View>

        <Button 
          title="Retry Secure Initialization" 
          onPress={() => init(true)} 
          style={{ marginTop: 32, width: '100%' }} 
        />
        
        <Typography variant="small" align="center" color={colors.textSecondary} style={{ marginTop: 16 }}>
          Tip: Ensure you have granted all necessary permissions and your device storage is not full.
        </Typography>
      </View>
    );
  }


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
    <ThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorDetail: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 24,
  },

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
