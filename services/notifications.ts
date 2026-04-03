import { Platform } from 'react-native';

/**
 * Notifications Service (Disabled for Compatibility)
 * Currently set to no-op to avoid issues with Expo Go SDK 53/54 
 * which does not support native push notifications in some environments.
 */

export const requestNotificationPermissions = async () => {
  console.log('[Notifications] Disabled for compatibility');
  return false;
};

export const scheduleDailyReminder = async () => {
  // No-op
};
